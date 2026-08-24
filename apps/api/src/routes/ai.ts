import { Router } from 'express';
import { ProjectAnalyzer, TestGenerator, FailureAnalyzer, AutoHealer, fixProposalEngine, verificationEngine } from '@novaqa/ai';
import {
  AIAnalyzeProjectSchema,
  AIGenerateTestsSchema,
  AIFailureTriageSchema,
  AIAutoHealSchema,
  ApproveFixSchema,
  VerifyFixSchema
} from '@novaqa/types';
import { prisma } from '@novaqa/database';
import { NotFoundError } from '@novaqa/shared';
import { authMiddleware, requirePermission } from '../middleware/auth';

export const aiRouter = Router();
aiRouter.use(authMiddleware);

const projectAnalyzer = new ProjectAnalyzer();
const testGenerator = new TestGenerator();
const failureAnalyzer = new FailureAnalyzer();
const autoHealer = new AutoHealer();

// AI Project Specification & Flow Discovery (requires ai.trigger)
aiRouter.post('/api/v1/ai/analyze-project', requirePermission('ai.trigger'), async (req, res, next) => {
  try {
    const payload = AIAnalyzeProjectSchema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: { id: payload.projectId, organizationId: req.auth!.organizationId }
    });

    if (!project) {
      throw new NotFoundError('Project', payload.projectId);
    }

    const result = await projectAnalyzer.analyze(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// AI Test Generation (requires ai.trigger)
aiRouter.post('/api/v1/ai/generate-tests', requirePermission('ai.trigger'), async (req, res, next) => {
  try {
    const payload = AIGenerateTestsSchema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: { id: payload.projectId, organizationId: req.auth!.organizationId }
    });

    if (!project) {
      throw new NotFoundError('Project', payload.projectId);
    }

    const result = await testGenerator.generateTests(payload);

    // If suiteId was provided, automatically persist generated tests to database
    if (payload.suiteId && result.testCases?.length) {
      for (const tc of result.testCases) {
        await prisma.testCase.create({
          data: {
            suiteId: payload.suiteId,
            title: tc.title,
            category: tc.category,
            priority: tc.priority,
            expectedResult: tc.expectedResult,
            codeSnippet: tc.codeSnippet,
            steps: {
              create: tc.steps.map((s) => ({
                order: s.order,
                action: s.action,
                target: s.target,
                value: s.value,
                description: s.description,
                expectedOutput: s.expectedOutput
              }))
            }
          }
        });
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// AI Failure Triage (requires ai.trigger)
aiRouter.post('/api/v1/ai/triage-failure', requirePermission('ai.trigger'), async (req, res, next) => {
  try {
    const payload = AIFailureTriageSchema.parse(req.body);
    const result = await failureAnalyzer.analyzeFailure(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// AI Auto-Healer (requires ai.trigger)
aiRouter.post('/api/v1/ai/auto-heal', requirePermission('ai.trigger'), async (req, res, next) => {
  try {
    const payload = AIAutoHealSchema.parse(req.body);
    const result = await autoHealer.healSelector(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// AI Generate Fix Proposal Patch (requires ai.trigger)
aiRouter.post('/api/v1/findings/:id/propose-fix', requirePermission('ai.trigger'), async (req, res, next) => {
  try {
    const findingId = String(req.params.id);
    const result = await fixProposalEngine.generateFixProposal(findingId);
    if (!result) throw new NotFoundError('Finding', findingId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Explicit User Approval for Proposed Fix (requires finding.update)
aiRouter.post('/api/v1/findings/:id/approve-fix', requirePermission('finding.update'), async (req, res, next) => {
  try {
    const findingId = String(req.params.id);
    const payload = ApproveFixSchema.partial().parse(req.body || {});

    const result = await fixProposalEngine.approveFix(findingId, {
      actor: req.auth?.userId || 'OPERATOR',
      patchOverride: payload.patchOverride,
      notes: payload.notes
    });

    if (!result.success) {
      throw new NotFoundError('Finding', findingId);
    }

    res.json({ success: true, message: result.message, data: result.finding });
  } catch (err) {
    next(err);
  }
});

// Execute Fix Verification Lifecycle Pipeline (requires run.execute)
aiRouter.post('/api/v1/findings/:id/verify-fix', requirePermission('run.execute'), async (req, res, next) => {
  try {
    const findingId = String(req.params.id);
    const payload = VerifyFixSchema.partial().parse(req.body || {});

    const result = await verificationEngine.verifyFix(findingId, {
      scope: payload.scope || 'FULL_REGRESSION',
      environmentId: payload.environmentId
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Retrieve Fix History Audit Trail
aiRouter.get('/api/v1/findings/:id/history', async (req, res, next) => {
  try {
    const findingId = String(req.params.id);
    const history = await fixProposalEngine.getFixHistory(findingId);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

// Rollback Fix (requires finding.update)
aiRouter.post('/api/v1/findings/:id/rollback', requirePermission('finding.update'), async (req, res, next) => {
  try {
    const findingId = String(req.params.id);
    const result = await fixProposalEngine.rollbackFix(findingId, {
      actor: req.auth?.userId || 'OPERATOR',
      reason: req.body?.reason || 'Manual rollback by user'
    });
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});
