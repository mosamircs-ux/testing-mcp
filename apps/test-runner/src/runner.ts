import { prisma } from '@novaqa/database';
import { PlaywrightEngine } from '@novaqa/browser';
import { ApiTestEngine } from '@novaqa/api-testing';
import { MobileTestEngine } from '@novaqa/mobile-testing';
import { ExecutionContext, TestEngine } from '@novaqa/testing';
import { FailureAnalyzer } from '@novaqa/ai';
import { storage, createChildLogger } from '@novaqa/shared';
import { TestRunStatus, TestResultStatus, EngineType, ArtifactType, FindingCategory, FindingSeverity, FindingStatus } from '@novaqa/types';

const log = createChildLogger('test-runner');

export class TestExecutionOrchestrator {
  private failureAnalyzer = new FailureAnalyzer();

  async executeRun(testRunId: string): Promise<void> {
    log.info({ testRunId }, 'Starting test run execution...');

    const run = await prisma.testRun.findUnique({
      where: { id: testRunId },
      include: {
        project: true,
        environment: true,
        suite: {
          include: {
            testCases: {
              include: { steps: { orderBy: { order: 'asc' } } }
            }
          }
        }
      }
    });

    if (!run) {
      log.error({ testRunId }, 'Test run not found in database');
      return;
    }

    // Mark run as RUNNING
    await prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    const testCases = run.suite?.testCases || [];
    let parsedVars: Record<string, string> = {};
    try {
      parsedVars = typeof run.environment.variables === 'string'
        ? JSON.parse(run.environment.variables)
        : (run.environment.variables as any) || {};
    } catch {}

    const context = new ExecutionContext(
      testRunId,
      run.environment.baseUrl,
      parsedVars
    );

    // Select engine based on project configuration
    let engine: TestEngine;
    if (run.project.engineType === EngineType.API_REST || run.project.engineType === EngineType.API_GRAPHQL) {
      engine = new ApiTestEngine();
    } else if (run.project.engineType === EngineType.MOBILE_HARNESS) {
      engine = new MobileTestEngine();
    } else {
      engine = new PlaywrightEngine();
    }

    let passedCount = 0;
    let failedCount = 0;
    const startTime = Date.now();

    try {
      await engine.initialize(context);

      for (const tc of testCases) {
        log.info({ testCaseId: tc.id, title: tc.title }, 'Executing test case');

        const result = await engine.executeTestCase(tc as any, context);

        // Save TestResult to database
        const dbResult = await prisma.testResult.create({
          data: {
            testRunId: run.id,
            testCaseId: tc.id,
            status: result.status,
            durationMs: result.durationMs,
            errorMessage: result.errorMessage,
            stackTrace: result.stackTrace,
            stepResults: JSON.stringify(result.stepResults),
            startedAt: new Date(Date.now() - result.durationMs),
            completedAt: new Date()
          }
        });

        if (result.status === TestResultStatus.PASSED) {
          passedCount++;
        } else {
          failedCount++;

          // Autonomous AI Failure Triaging
          try {
            const triage = await this.failureAnalyzer.analyzeFailure({
              testResultId: dbResult.id,
              errorMessage: result.errorMessage || 'Step failed without message',
              stackTrace: result.stackTrace,
              stepLogs: context.logs
            });

            await prisma.finding.create({
              data: {
                testRunId: run.id,
                testResultId: dbResult.id,
                projectId: run.projectId,
                category: triage.category,
                severity: triage.severity,
                status: 'OPEN',
                title: triage.title,
                description: `Autonomous analysis of failure in '${tc.title}'`,
                rootCauseAnalysis: triage.rootCauseAnalysis,
                suggestedFix: triage.suggestedFix,
                suggestedPatch: triage.suggestedPatch,
                autoHealSelector: triage.autoHealSelector
              }
            });
          } catch (triageErr) {
            log.error({ triageErr }, 'Failed to generate AI finding for failed test');
          }
        }

        // Upload any artifacts generated during this test case
        for (const art of context.artifacts) {
          const storageKey = `runs/${run.id}/${art.type.toLowerCase()}/${Date.now()}_${art.name}`;
          await storage.upload(art.buffer, {
            key: storageKey,
            contentType: art.mimeType
          });

          await prisma.artifact.create({
            data: {
              testRunId: run.id,
              testResultId: dbResult.id,
              type: art.type,
              fileName: art.name,
              fileSize: art.buffer.length,
              mimeType: art.mimeType,
              storageKey,
              storageUrl: storage.getPublicUrl(storageKey),
              metadata: JSON.stringify({ name: art.name })
            }
          });
        }

        // Clear artifacts for next case
        context.artifacts = [];
      }
    } catch (err: any) {
      log.error({ err }, 'Test execution failed with unexpected error');
    } finally {
      await engine.cleanup();

      const totalDuration = Date.now() - startTime;
      const finalStatus = failedCount > 0 ? 'FAILED' : 'PASSED';

      await prisma.testRun.update({
        where: { id: testRunId },
        data: {
          status: finalStatus,
          totalTests: testCases.length,
          passedTests: passedCount,
          failedTests: failedCount,
          durationMs: totalDuration,
          completedAt: new Date()
        }
      });

      log.info({ testRunId, finalStatus, totalDuration }, 'Test run completed');
    }
  }
}

export const orchestrator = new TestExecutionOrchestrator();
