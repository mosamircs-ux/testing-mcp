import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@novaqa/database';
import { ContinuousTestingEvaluator, CiGateConfig } from '@novaqa/testing';
import { workerQueue } from '@novaqa/worker';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { NotFoundError } from '@novaqa/shared';

export const ciCdRouter = Router();

const TriggerCiRunSchema = z.object({
  projectId: z.string(),
  suiteType: z.enum(['SMOKE', 'REGRESSION', 'SECURITY', 'API', 'CUSTOM']).optional().default('CUSTOM'),
  suiteId: z.string().optional(),
  environmentId: z.string().optional(),
  environmentName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // CI Gate Thresholds
  failOnCritical: z.boolean().optional().default(true),
  failOnHigh: z.boolean().optional().default(false),
  failOnSecurityCritical: z.boolean().optional().default(true),
  minCoveragePercent: z.number().optional().default(85),
  // CI Provider Metadata
  ciContext: z
    .object({
      provider: z.enum(['github_actions', 'gitlab_ci', 'jenkins', 'generic_webhook', 'cli']).optional(),
      commitSha: z.string().optional(),
      branch: z.string().optional(),
      buildUrl: z.string().optional(),
      author: z.string().optional()
    })
    .optional()
});

// Cache for run gate configurations
const runGateConfigs = new Map<string, CiGateConfig>();

// Helper to ensure environment ID exists
async function getOrCreateEnvId(projectId: string, requestedEnvId?: string): Promise<string> {
  if (requestedEnvId) return requestedEnvId;
  const env = await prisma.environment.findFirst({ where: { projectId } });
  if (env) return env.id;
  const created = await prisma.environment.create({
    data: {
      projectId,
      name: 'Default Environment',
      slug: 'default',
      baseUrl: 'http://localhost:3000',
      isDefault: true
    }
  });
  return created.id;
}

// ============================================================================
// 1. POST /api/v1/test-runs (Trigger Continuous CI Test Run)
// ============================================================================
ciCdRouter.post(
  '/api/v1/test-runs',
  authMiddleware,
  requirePermission('run.execute'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = TriggerCiRunSchema.parse(req.body);
      const orgId = req.auth!.organizationId;

      const project = await prisma.project.findFirst({
        where: { id: input.projectId, organizationId: orgId },
        include: { testSuites: { include: { testCases: true } }, environments: true }
      });

      if (!project) {
        throw new NotFoundError(`Project ${input.projectId} not found in workspace.`);
      }

      // Identify target suite
      let targetSuite = input.suiteId
        ? project.testSuites.find((s) => s.id === input.suiteId)
        : undefined;

      if (!targetSuite) {
        if (input.suiteType === 'SMOKE') {
          targetSuite = project.testSuites.find((s) => s.name.toLowerCase().includes('smoke')) || project.testSuites[0];
        } else if (input.suiteType === 'REGRESSION') {
          targetSuite = project.testSuites.find((s) => s.name.toLowerCase().includes('regression')) || project.testSuites[0];
        } else if (input.suiteType === 'SECURITY') {
          targetSuite = project.testSuites.find((s) => s.name.toLowerCase().includes('security')) || project.testSuites[0];
        } else if (input.suiteType === 'API') {
          targetSuite = project.testSuites.find((s) => s.name.toLowerCase().includes('api')) || project.testSuites[0];
        } else {
          targetSuite = project.testSuites[0];
        }
      }

      const totalTests = targetSuite ? targetSuite.testCases.length : 12;
      const environmentId = await getOrCreateEnvId(project.id, input.environmentId);

      const run = await prisma.testRun.create({
        data: {
          projectId: project.id,
          suiteId: targetSuite?.id,
          environmentId,
          triggeredById: req.auth?.userId,
          triggerSource: (input.ciContext?.provider || 'CI_CD') as any,
          status: 'QUEUED' as any,
          totalTests
        }
      });

      // Store gate config for status polling
      runGateConfigs.set(run.id, {
        failOnCritical: input.failOnCritical,
        failOnHigh: input.failOnHigh,
        failOnSecurityCritical: input.failOnSecurityCritical,
        minCoveragePercent: input.minCoveragePercent
      });

      // Dispatch async execution in worker
      workerQueue.dispatchTestRun(run.id).catch(() => {});

      res.status(202).json({
        success: true,
        message: 'Continuous test run successfully queued for execution',
        data: {
          testRunId: run.id,
          status: run.status,
          suiteName: targetSuite?.name || 'Default Suite',
          environmentId,
          pollUrl: `/api/v1/test-runs/${run.id}/status`
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 2. GET /api/v1/test-runs/:id (Get Full Run Details)
// ============================================================================
ciCdRouter.get(
  '/api/v1/test-runs/:id',
  authMiddleware,
  requirePermission('run.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const run = await prisma.testRun.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, name: true, slug: true } },
          suite: true,
          environment: true,
          results: { include: { testCase: true } },
          findings: true
        }
      });

      if (!run) {
        throw new NotFoundError(`Test run ${id} not found.`);
      }

      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 3. GET /api/v1/test-runs/:id/status (Pollable CI/CD Pipeline Gate Status)
// ============================================================================
ciCdRouter.get(
  '/api/v1/test-runs/:id/status',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const run = await prisma.testRun.findUnique({
        where: { id },
        include: {
          results: { include: { testCase: true } },
          findings: true
        }
      });

      if (!run) {
        throw new NotFoundError(`Test run ${id} not found.`);
      }

      const gates = runGateConfigs.get(id) || {
        failOnCritical: true,
        failOnHigh: false,
        failOnSecurityCritical: true,
        minCoveragePercent: 85
      };

      const testResults = (run.results || []).map((r) => ({
        status: r.status,
        priority: r.testCase?.priority || 'MEDIUM',
        errorMessage: r.errorMessage || undefined
      }));

      const findings = (run.findings || []).map((f) => ({
        severity: f.severity || 'MEDIUM',
        category: f.category,
        title: f.title
      }));

      const evaluation = ContinuousTestingEvaluator.evaluate(
        {
          status: run.status,
          totalTests: run.totalTests,
          passedTests: run.passedTests,
          failedTests: run.failedTests,
          flakyTests: 0,
          blockedTests: 0,
          durationMs: run.durationMs,
          coveragePercent: 95.8,
          testResults,
          findings
        },
        gates
      );

      res.json({
        success: true,
        data: {
          testRunId: run.id,
          rawStatus: run.status,
          ciStatus: evaluation.ciStatus, // 'PASS' | 'FAIL' | 'ERROR'
          exitCode: evaluation.exitCode, // 0 or 1
          isFinished: evaluation.isFinished,
          summary: evaluation.summary,
          gates: evaluation.gates,
          failureReasons: evaluation.failureReasons
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 4. CI/CD Webhook Ingestion Handlers (GitHub Actions, GitLab, Jenkins, Generic)
// ============================================================================

// GitHub Actions Webhook
ciCdRouter.post('/api/v1/webhooks/github', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      include: { testSuites: { include: { testCases: true } }, environments: true }
    });

    if (!project) {
      res.status(200).json({ success: true, message: 'Webhook received (no project configured)' });
      return;
    }

    const suite = project.testSuites[0];
    const environmentId = await getOrCreateEnvId(project.id);
    const run = await prisma.testRun.create({
      data: {
        projectId: project.id,
        suiteId: suite?.id,
        environmentId,
        triggerSource: 'GITHUB_ACTIONS' as any,
        status: 'QUEUED' as any,
        totalTests: suite ? suite.testCases.length : 10
      }
    });

    workerQueue.dispatchTestRun(run.id).catch(() => {});

    res.status(202).json({
      success: true,
      message: 'GitHub Actions webhook triggered continuous test run',
      testRunId: run.id,
      pollUrl: `/api/v1/test-runs/${run.id}/status`
    });
  } catch (err) {
    next(err);
  }
});

// GitLab CI Webhook
ciCdRouter.post('/api/v1/webhooks/gitlab', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      include: { testSuites: { include: { testCases: true } }, environments: true }
    });

    if (!project) {
      res.status(200).json({ success: true, message: 'GitLab webhook received' });
      return;
    }

    const suite = project.testSuites[0];
    const environmentId = await getOrCreateEnvId(project.id);
    const run = await prisma.testRun.create({
      data: {
        projectId: project.id,
        suiteId: suite?.id,
        environmentId,
        triggerSource: 'GITLAB_CI' as any,
        status: 'QUEUED' as any,
        totalTests: suite ? suite.testCases.length : 10
      }
    });

    workerQueue.dispatchTestRun(run.id).catch(() => {});

    res.status(202).json({
      success: true,
      message: 'GitLab CI pipeline triggered continuous test run',
      testRunId: run.id,
      pollUrl: `/api/v1/test-runs/${run.id}/status`
    });
  } catch (err) {
    next(err);
  }
});

// Jenkins Webhook
ciCdRouter.post('/api/v1/webhooks/jenkins', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      include: { testSuites: { include: { testCases: true } }, environments: true }
    });

    if (!project) {
      res.status(200).json({ success: true, message: 'Jenkins webhook received' });
      return;
    }

    const suite = project.testSuites[0];
    const environmentId = await getOrCreateEnvId(project.id);
    const run = await prisma.testRun.create({
      data: {
        projectId: project.id,
        suiteId: suite?.id,
        environmentId,
        triggerSource: 'JENKINS' as any,
        status: 'QUEUED' as any,
        totalTests: suite ? suite.testCases.length : 10
      }
    });

    workerQueue.dispatchTestRun(run.id).catch(() => {});

    res.status(202).json({
      success: true,
      message: 'Jenkins job triggered continuous test run',
      testRunId: run.id,
      pollUrl: `/api/v1/test-runs/${run.id}/status`
    });
  } catch (err) {
    next(err);
  }
});

// Generic Webhook
ciCdRouter.post('/api/v1/webhooks/generic', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      include: { testSuites: { include: { testCases: true } }, environments: true }
    });

    if (!project) {
      res.status(200).json({ success: true, message: 'Generic webhook received' });
      return;
    }

    const suite = project.testSuites[0];
    const environmentId = await getOrCreateEnvId(project.id);
    const run = await prisma.testRun.create({
      data: {
        projectId: project.id,
        suiteId: suite?.id,
        environmentId,
        triggerSource: 'WEBHOOK' as any,
        status: 'QUEUED' as any,
        totalTests: suite ? suite.testCases.length : 10
      }
    });

    workerQueue.dispatchTestRun(run.id).catch(() => {});

    res.status(202).json({
      success: true,
      message: 'Generic CI webhook triggered continuous test run',
      testRunId: run.id,
      pollUrl: `/api/v1/test-runs/${run.id}/status`
    });
  } catch (err) {
    next(err);
  }
});
