import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { TriggerTestRunSchema, TestRunStatus } from '@novaqa/types';
import { workerQueue } from '@novaqa/worker';
import { JUnitReporter, MarkdownReporter } from '@novaqa/reporting';
import { NotFoundError, ForbiddenError } from '@novaqa/shared';
import { authMiddleware, requirePermission, requireProjectAccess } from '../middleware/auth';

export const runsRouter = Router();

// Apply auth middleware to all runs endpoints
runsRouter.use(authMiddleware);

// 1. Trigger a new Test Run (requires run.execute)
runsRouter.post('/api/v1/runs', requirePermission('run.execute'), requireProjectAccess, async (req, res, next) => {
  try {
    const payload = TriggerTestRunSchema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: {
        id: payload.projectId,
        organizationId: req.auth!.organizationId
      },
      include: {
        testSuites: { include: { testCases: true } },
        environments: true
      }
    });

    if (!project) throw new NotFoundError('Project', payload.projectId);

    // Identify target suite
    const targetSuite = payload.suiteId
      ? project.testSuites.find((s) => s.id === payload.suiteId)
      : project.testSuites[0];

    const totalTests = targetSuite ? targetSuite.testCases.length : 0;

    const run = await prisma.testRun.create({
      data: {
        projectId: project.id,
        suiteId: targetSuite?.id,
        environmentId: payload.environmentId,
        triggeredById: req.auth?.userId,
        triggerSource: payload.triggerSource as any,
        status: TestRunStatus.QUEUED,
        totalTests
      }
    });

    // Dispatch to background execution worker
    workerQueue.dispatchTestRun(run.id).catch(() => {});

    res.status(202).json({
      success: true,
      message: 'Test run enqueued successfully',
      data: {
        testRunId: run.id,
        status: run.status,
        streamUrl: `/api/v1/runs/${run.id}/stream`
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. List Test Runs (tenant-scoped, requires run.read)
runsRouter.get('/api/v1/runs', requirePermission('run.read'), async (req, res, next) => {
  try {
    const orgId = req.auth!.organizationId;

    const runs = await prisma.testRun.findMany({
      where: {
        project: { organizationId: orgId }
      },
      include: {
        project: { select: { name: true, slug: true, category: true, engineType: true } },
        suite: { select: { name: true } },
        environment: { select: { name: true, baseUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
});

// 3. Get Test Run Details (tenant-scoped, requires run.read)
runsRouter.get('/api/v1/runs/:id', requirePermission('run.read'), async (req, res, next) => {
  try {
    const run = await prisma.testRun.findFirst({
      where: {
        id: req.params.id,
        project: { organizationId: req.auth!.organizationId }
      },
      include: {
        project: true,
        suite: true,
        environment: true,
        results: {
          include: {
            testCase: true,
            artifacts: true,
            findings: true
          }
        },
        artifacts: true,
        findings: true
      }
    });

    if (!run) throw new NotFoundError('TestRun', req.params.id);

    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});

// 4. Cancel Test Run (requires run.cancel)
runsRouter.post('/api/v1/runs/:id/cancel', requirePermission('run.cancel'), async (req, res, next) => {
  try {
    const run = await prisma.testRun.findFirst({
      where: {
        id: req.params.id,
        project: { organizationId: req.auth!.organizationId }
      }
    });

    if (!run) throw new NotFoundError('TestRun', req.params.id);

    const updated = await prisma.testRun.update({
      where: { id: req.params.id },
      data: { status: TestRunStatus.CANCELLED, completedAt: new Date() }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// 5. Live Server-Sent Events (SSE) Stream for real-time test run logs & step progress
runsRouter.get('/api/v1/runs/:id/stream', async (req, res, next) => {
  try {
    const runId = req.params.id;

    // Verify access
    const runCheck = await prisma.testRun.findFirst({
      where: {
        id: runId,
        project: { organizationId: req.auth!.organizationId }
      }
    });

    if (!runCheck) {
      throw new NotFoundError('TestRun', runId);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', runId, timestamp: new Date().toISOString() })}\n\n`);

    const interval = setInterval(async () => {
      const currentRun = await prisma.testRun.findUnique({
        where: { id: runId },
        include: { results: { include: { testCase: true } } }
      });

      if (!currentRun) {
        clearInterval(interval);
        res.end();
        return;
      }

      res.write(
        `data: ${JSON.stringify({
          type: 'STATUS_UPDATE',
          status: currentRun.status,
          passedTests: currentRun.passedTests,
          failedTests: currentRun.failedTests,
          totalTests: currentRun.totalTests,
          durationMs: currentRun.durationMs,
          resultsCount: currentRun.results.length
        })}\n\n`
      );

      if (['PASSED', 'FAILED', 'CANCELLED', 'TIMED_OUT'].includes(currentRun.status)) {
        res.write(`data: ${JSON.stringify({ type: 'RUN_FINISHED', status: currentRun.status })}\n\n`);
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (err) {
    next(err);
  }
});

// 6. Export JUnit XML Report
runsRouter.get('/api/v1/runs/:id/report/junit.xml', requirePermission('run.read'), async (req, res, next) => {
  try {
    const run = await prisma.testRun.findFirst({
      where: {
        id: req.params.id,
        project: { organizationId: req.auth!.organizationId }
      },
      include: {
        results: { include: { testCase: true } },
        findings: true
      }
    });

    if (!run) throw new NotFoundError('TestRun', req.params.id);

    const reportData = {
      run: run as any,
      results: run.results.map((r) => ({
        ...r,
        testCaseTitle: r.testCase.title
      })) as any,
      findings: run.findings as any
    };

    const xml = JUnitReporter.generate(reportData);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

// 7. Export Markdown Report
runsRouter.get('/api/v1/runs/:id/report/summary.md', requirePermission('run.read'), async (req, res, next) => {
  try {
    const run = await prisma.testRun.findFirst({
      where: {
        id: req.params.id,
        project: { organizationId: req.auth!.organizationId }
      },
      include: {
        results: { include: { testCase: true } },
        findings: true
      }
    });

    if (!run) throw new NotFoundError('TestRun', req.params.id);

    const reportData = {
      run: run as any,
      results: run.results.map((r) => ({
        ...r,
        testCaseTitle: r.testCase.title
      })) as any,
      findings: run.findings as any
    };

    const md = MarkdownReporter.generate(reportData);
    res.setHeader('Content-Type', 'text/markdown');
    res.send(md);
  } catch (err) {
    next(err);
  }
});
