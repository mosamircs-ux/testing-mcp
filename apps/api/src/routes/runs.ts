import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { TriggerTestRunSchema, TestRunStatus } from '@novaqa/types';
import { orchestrator } from '@novaqa/test-runner';
import { workerQueue } from '@novaqa/worker';
import { ExecutionTelemetryEvent } from '@novaqa/testing';
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
    const id = String(req.params.id);
    const run = await prisma.testRun.findFirst({
      where: {
        id,
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

    if (!run) throw new NotFoundError('TestRun', id);

    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});

// 4. Cancel Test Run (requires run.cancel)
runsRouter.post('/api/v1/runs/:id/cancel', requirePermission('run.cancel'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const run = await prisma.testRun.findFirst({
      where: {
        id,
        project: { organizationId: req.auth!.organizationId }
      }
    });

    if (!run) throw new NotFoundError('TestRun', id);

    // Trigger immediate cancellation on active execution context and worker
    await workerQueue.cancelJob(id, req.body?.reason || 'Cancelled by user');

    const updated = await prisma.testRun.findUnique({
      where: { id }
    });

    res.json({ success: true, message: 'Test run cancelled successfully', data: updated });
  } catch (err) {
    next(err);
  }
});

// 4.1 Restart Test Run (re-queues and triggers fresh execution)
runsRouter.post('/api/v1/runs/:id/restart', requirePermission('run.execute'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const originalRun = await prisma.testRun.findFirst({
      where: {
        id,
        project: { organizationId: req.auth!.organizationId }
      },
      include: {
        suite: { include: { testCases: true } }
      }
    });

    if (!originalRun) throw new NotFoundError('TestRun', id);

    // Cancel existing active run if still running
    await workerQueue.cancelJob(id, 'Restarted by user').catch(() => {});

    // Create fresh test run
    const newRun = await prisma.testRun.create({
      data: {
        projectId: originalRun.projectId,
        suiteId: originalRun.suiteId,
        environmentId: originalRun.environmentId,
        triggeredById: req.auth?.userId,
        triggerSource: 'MANUAL',
        status: TestRunStatus.QUEUED,
        totalTests: originalRun.suite?.testCases.length || originalRun.totalTests || 0
      }
    });

    // Dispatch to background queue worker
    workerQueue.dispatchTestRun(newRun.id).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Test run restarted successfully',
      data: {
        oldRunId: id,
        newRunId: newRun.id,
        status: newRun.status,
        streamUrl: `/api/v1/runs/${newRun.id}/stream`
      }
    });
  } catch (err) {
    next(err);
  }
});

// 5. Live Server-Sent Events (SSE) Stream for real-time test run logs & step progress
runsRouter.get('/api/v1/runs/:id/stream', async (req, res, next) => {
  try {
    const runId = String(req.params.id);

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

    // 1. Subscribe to Live Orchestrator Telemetry Events
    const unsubscribe = orchestrator.subscribeTelemetry(runId, (event) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {}
    });

    // 2. Periodic Database Polling Heartbeat
    const interval = setInterval(async () => {
      const currentRun = await prisma.testRun.findUnique({
        where: { id: runId },
        include: { results: { include: { testCase: true } } }
      });

      if (!currentRun) {
        clearInterval(interval);
        unsubscribe();
        res.end();
        return;
      }

      res.write(
        `data: ${JSON.stringify({
          type: 'STATUS_UPDATE',
          status: currentRun.status,
          passedTests: currentRun.passedTests,
          failedTests: currentRun.failedTests,
          skippedTests: currentRun.skippedTests,
          totalTests: currentRun.totalTests,
          durationMs: currentRun.durationMs,
          resultsCount: currentRun.results.length,
          timestamp: new Date().toISOString()
        })}\n\n`
      );

      if (['PASSED', 'FAILED', 'CANCELLED', 'TIMED_OUT', 'BLOCKED', 'FLAKY'].includes(currentRun.status)) {
        res.write(`data: ${JSON.stringify({ type: 'RUN_FINISHED', status: currentRun.status })}\n\n`);
        clearInterval(interval);
        unsubscribe();
        res.end();
      }
    }, 1500);

    req.on('close', () => {
      clearInterval(interval);
      unsubscribe();
    });
  } catch (err) {
    next(err);
  }
});

// 6. Export JUnit XML Report
runsRouter.get('/api/v1/runs/:id/report/junit.xml', requirePermission('run.read'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const run = await prisma.testRun.findFirst({
      where: {
        id,
        project: { organizationId: req.auth!.organizationId }
      },
      include: {
        results: { include: { testCase: true } },
        findings: true
      }
    });

    if (!run) throw new NotFoundError('TestRun', id);

    const reportData = {
      run: run as any,
      results: run.results.map((r: any) => ({
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
    const id = String(req.params.id);
    const run = await prisma.testRun.findFirst({
      where: {
        id,
        project: { organizationId: req.auth!.organizationId }
      },
      include: {
        results: { include: { testCase: true } },
        findings: true
      }
    });

    if (!run) throw new NotFoundError('TestRun', id);

    const reportData = {
      run: run as any,
      results: run.results.map((r: any) => ({
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
