import { prisma } from '@novaqa/database';
import { PlaywrightEngine } from '@novaqa/browser';
import { ApiTestEngine } from '@novaqa/api-testing';
import { MobileTestEngine } from '@novaqa/mobile-testing';
import { ExecutionContext, ExecutionTelemetryEvent, TestEngine } from '@novaqa/testing';
import { FailureAnalyzer, AutoHealer, fixProposalEngine, verificationEngine } from '@novaqa/ai';
import { storage, createChildLogger } from '@novaqa/shared';
import {
  TestRunStatus,
  TestResultStatus,
  EngineType,
  ArtifactType,
  FindingCategory,
  FindingSeverity,
  FindingStatus,
  TestCase
} from '@novaqa/types';

const log = createChildLogger('test-runner');

export class TestExecutionOrchestrator {
  private failureAnalyzer = new FailureAnalyzer();
  private autoHealer = new AutoHealer();
  private activeContexts = new Map<string, ExecutionContext>();
  private activeEngines = new Map<string, TestEngine>();
  private telemetryListeners = new Map<string, Set<(event: ExecutionTelemetryEvent) => void>>();

  /**
   * Register a subscriber for live SSE / WebSocket telemetry events
   */
  subscribeTelemetry(runId: string, listener: (event: ExecutionTelemetryEvent) => void): () => void {
    if (!this.telemetryListeners.has(runId)) {
      this.telemetryListeners.set(runId, new Set());
    }
    const listeners = this.telemetryListeners.get(runId)!;
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.telemetryListeners.delete(runId);
      }
    };
  }

  private dispatchTelemetry(event: ExecutionTelemetryEvent) {
    const listeners = this.telemetryListeners.get(event.runId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch {}
      }
    }
  }

  /**
   * Cancel an in-flight test execution run
   */
  async cancelRun(testRunId: string, reason = 'Cancelled by user'): Promise<boolean> {
    log.info({ testRunId, reason }, 'Cancelling test run execution...');
    const context = this.activeContexts.get(testRunId);
    if (context) {
      context.cancel(reason);
    }

    const engine = this.activeEngines.get(testRunId);
    if (engine) {
      await engine.cleanup().catch(() => {});
    }

    await prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status: TestRunStatus.CANCELLED,
        completedAt: new Date()
      }
    }).catch(() => {});

    return true;
  }

  /**
   * Executes a full test run suite with retries, flaky detection, and concurrency
   */
  async executeRun(testRunId: string): Promise<void> {
    log.info({ testRunId }, '🚀 Starting test run execution...');

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
        status: TestRunStatus.RUNNING,
        startedAt: new Date()
      }
    });

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

    this.activeContexts.set(testRunId, context);

    // Forward all context telemetry to listeners
    context.on('telemetry', (event: ExecutionTelemetryEvent) => {
      this.dispatchTelemetry(event);
    });

    context.emitEvent('RUN_STARTED', {
      runId: testRunId,
      projectName: run.project.name,
      environmentName: run.environment.name,
      totalTests: run.suite?.testCases.length || 0
    });

    // Select engine based on project configuration
    let engine: TestEngine;
    if (run.project.engineType === EngineType.API_REST || run.project.engineType === EngineType.API_GRAPHQL) {
      engine = new ApiTestEngine();
    } else if (
      run.project.engineType === EngineType.MOBILE_HARNESS ||
      run.project.engineType === EngineType.MOBILE_ANDROID ||
      run.project.engineType === EngineType.MOBILE_IOS ||
      run.project.category === 'MOBILE' ||
      run.project.category === 'MOBILE_APP'
    ) {
      const isIos = run.project.engineType === EngineType.MOBILE_IOS || run.project.name.toLowerCase().includes('ios');
      engine = new MobileTestEngine({ platform: isIos ? 'ios' : 'android' });
    } else {
      engine = new PlaywrightEngine();
    }

    this.activeEngines.set(testRunId, engine);

    let passedCount = 0;
    let failedCount = 0;
    let flakyCount = 0;
    let skippedCount = 0;
    let blockedCount = 0;
    const startTime = Date.now();
    const testCases = run.suite?.testCases || [];

    try {
      await engine.initialize(context);

      for (const tc of testCases) {
        if (context.isCancelled) {
          log.info({ testRunId, testCaseId: tc.id }, 'Skipping remaining test cases due to cancellation');
          skippedCount++;
          continue;
        }

        log.info({ testCaseId: tc.id, title: tc.title }, 'Executing test case');

        let attempts = 0;
        const maxAttempts = 2; // Support 1 initial execution + 1 automatic retry
        let finalResult: any = null;
        let isFlaky = false;

        while (attempts < maxAttempts) {
          attempts++;
          if (attempts > 1) {
            context.log(`🔄 Retrying test case "${tc.title}" (Attempt ${attempts}/${maxAttempts})...`);
          }

          finalResult = await engine.executeTestCase(tc as any, context);

          if (finalResult.status === TestResultStatus.PASSED) {
            if (attempts > 1) {
              isFlaky = true;
              finalResult.status = TestResultStatus.FLAKY;
            }
            break;
          } else if (context.isCancelled) {
            finalResult.status = TestResultStatus.CANCELLED;
            break;
          }
        }

        // Determine final test outcome
        if (finalResult.status === TestResultStatus.PASSED) {
          passedCount++;
        } else if (finalResult.status === TestResultStatus.FLAKY) {
          flakyCount++;
          passedCount++; // Flaky tests ultimately passed

          // Update test case flakiness score in database
          await prisma.testCase.update({
            where: { id: tc.id },
            data: {
              isFlaky: true,
              flakinessScore: { increment: 0.25 }
            }
          }).catch(() => {});
        } else if (finalResult.status === TestResultStatus.CANCELLED) {
          skippedCount++;
        } else if (finalResult.status === TestResultStatus.BLOCKED) {
          blockedCount++;
        } else {
          failedCount++;
        }

        // Save TestResult to database
        const dbResult = await prisma.testResult.create({
          data: {
            testRunId: run.id,
            testCaseId: tc.id,
            status: finalResult.status,
            durationMs: finalResult.durationMs,
            errorMessage: finalResult.errorMessage,
            stackTrace: finalResult.stackTrace,
            stepResults: JSON.stringify(finalResult.stepResults),
            startedAt: new Date(Date.now() - finalResult.durationMs),
            completedAt: new Date()
          }
        });

        // AI Failure Analysis & Triaging on genuine failure or flake
        if (finalResult.status === TestResultStatus.FAILED || finalResult.status === TestResultStatus.FLAKY) {
          try {
            const triage = await this.failureAnalyzer.analyzeFailure({
              testResultId: dbResult.id,
              errorMessage: finalResult.errorMessage || (isFlaky ? 'Test intermittently failed then passed' : 'Step execution failed'),
              stackTrace: finalResult.stackTrace,
              stepLogs: context.logs
            });

            const finding = await prisma.finding.create({
              data: {
                testRunId: run.id,
                testResultId: dbResult.id,
                projectId: run.projectId,
                category: isFlaky ? FindingCategory.TEST_FLAKINESS : triage.category,
                severity: isFlaky ? FindingSeverity.LOW : triage.severity,
                status: FindingStatus.OPEN,
                title: isFlaky ? `Flaky Test Detected: ${tc.title}` : triage.title,
                description: isFlaky
                  ? `Test case failed on initial execution and succeeded on retry.`
                  : `Autonomous analysis of failure in '${tc.title}'`,
                rootCauseAnalysis: triage.rootCauseAnalysis,
                suggestedFix: triage.suggestedFix,
                suggestedPatch: triage.suggestedPatch,
                autoHealSelector: triage.autoHealSelector,
                confidence: triage.confidence,
                evidence: JSON.stringify(triage.evidence),
                affectedFiles: JSON.stringify(triage.affectedFiles),
                affectedCode: JSON.stringify(triage.affectedCode),
                regressionRisk: triage.regressionRisk
              }
            });

            // Automated Self-Healing (for eligible non-semantic test maintenance only)
            if (triage.isSelfHealEligible && tc.autoHealEnabled && triage.autoHealSelector) {
              await this.autoHealer.applySelfHeal(finding.id, tc.id, {
                type: triage.selfHealType || 'SELECTOR_UPDATE',
                targetCaseId: tc.id,
                originalValue: tc.title,
                healedValue: triage.autoHealSelector,
                confidence: triage.confidence,
                explanation: triage.suggestedFix,
                patchDiff: triage.suggestedPatch || undefined,
                safeToAutoApply: true
              });
            } else if (!triage.isSelfHealEligible) {
              // For genuine product bugs: generate a proposed patch requiring explicit approval
              await fixProposalEngine.generateFixProposal(finding.id).catch(() => {});
            }
          } catch (triageErr) {
            log.error({ triageErr }, 'Failed to generate AI finding for failed/flaky test');
          }
        }

        // Upload any artifacts generated during this test case directly to Object Storage
        for (const art of context.artifacts) {
          const storageKey = `runs/${run.id}/${art.type.toLowerCase()}/${Date.now()}_${art.name}`;
          await storage.upload(art.buffer, {
            key: storageKey,
            contentType: art.mimeType,
            metadata: { runId: run.id, testCaseId: tc.id, artifactType: art.type }
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
              metadata: JSON.stringify(art.metadata || { name: art.name })
            }
          });
        }

        // Reset artifacts for the next test case
        context.artifacts = [];
      }
    } catch (err: any) {
      log.error({ err: err.message }, 'Unexpected error during test execution cycle');
    } finally {
      await engine.cleanup().catch(() => {});
      this.activeContexts.delete(testRunId);
      this.activeEngines.delete(testRunId);

      const totalDuration = Date.now() - startTime;
      let finalStatus: TestRunStatus = TestRunStatus.PASSED;

      if (context.isCancelled) {
        finalStatus = TestRunStatus.CANCELLED;
      } else if (failedCount > 0) {
        finalStatus = TestRunStatus.FAILED;
      } else if (flakyCount > 0 && passedCount > 0) {
        finalStatus = TestRunStatus.FLAKY;
      } else if (testCases.length === 0) {
        finalStatus = TestRunStatus.PASSED;
      }

      await prisma.testRun.update({
        where: { id: testRunId },
        data: {
          status: finalStatus,
          totalTests: testCases.length,
          passedTests: passedCount,
          failedTests: failedCount,
          skippedTests: skippedCount,
          durationMs: totalDuration,
          completedAt: new Date()
        }
      });

      context.emitEvent('RUN_COMPLETED', {
        runId: testRunId,
        status: finalStatus,
        totalTests: testCases.length,
        passedTests: passedCount,
        failedTests: failedCount,
        durationMs: totalDuration
      });

      log.info({ testRunId, finalStatus, totalDuration }, '✅ Test run completed successfully');
    }
  }
}

export const orchestrator = new TestExecutionOrchestrator();
