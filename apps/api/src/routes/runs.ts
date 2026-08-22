import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { TriggerTestRunSchema, TestRunStatus } from '@novaqa/types';
import { workerQueue } from '@novaqa/worker';
import { orchestrator } from '@novaqa/test-runner';
import { JUnitReporter, MarkdownReporter } from '@novaqa/reporting';
import { NotFoundError } from '@novaqa/shared';

export const runsRouter = Router();

// Trigger a new Test Run
runsRouter.post('/api/v1/runs', async (req, res, next) => {
  try {
    const payload = TriggerTestRunSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: payload.projectId },
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

// List Test Runs
runsRouter.get('/api/v1/runs', async (req, res, next) => {
  try {
    const runs = await prisma.testRun.findMany({
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

// Get Test Run Details
runsRouter.get('/api/v1/runs/:id', async (req, res, next) => {
  try {
    const run = await prisma.testRun.findUnique({
      where: { id: req.params.id },
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

// Live Server-Sent Events (SSE) Stream for real-time test run logs & step progress
runsRouter.get('/api/v1/runs/:id/stream', async (req, res, next) => {
  try {
    const runId = req.params.id;

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

// Export JUnit XML Report
runsRouter.get('/api/v1/runs/:id/report/junit.xml', async (req, res, next) => {
  try {
    const run = await prisma.testRun.findUnique({
      where: { id: req.params.id },
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

// Export Markdown Report
runsRouter.get('/api/v1/runs/:id/report/summary.md', async (req, res, next) => {
  try {
    const run = await prisma.testRun.findUnique({
      where: { id: req.params.id },
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
