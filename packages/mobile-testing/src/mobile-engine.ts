import { TestEngine, ExecutionContext, TestEngineResult } from '@novaqa/testing';
import { TestCase, TestResultStatus, TestStepResult, MobilePlatform } from '@novaqa/types';
import { mobileDevicePool, MobileExecutionWorker } from './worker/device-pool-manager.js';
import { MobileDriverOptions } from './types.js';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('mobile-test-engine');

export class MobileTestEngine implements TestEngine {
  public readonly name = 'MobileHarnessEngine';
  private worker: MobileExecutionWorker | null = null;

  constructor(private options: MobileDriverOptions = { platform: MobilePlatform.ANDROID }) {}

  async initialize(context: ExecutionContext): Promise<void> {
    const platform = this.options.platform === 'ios' || this.options.platform === MobilePlatform.IOS
      ? MobilePlatform.IOS
      : MobilePlatform.ANDROID;

    context.log(`Acquiring mobile execution worker for platform: ${platform}`);
    this.worker = await mobileDevicePool.acquireWorker({
      platform,
      framework: this.options.framework,
      deviceType: this.options.deviceType,
      runId: context.runId
    });

    context.log(`Allocated device: ${this.worker.device.name} (OS: ${this.worker.device.osVersion}, ID: ${this.worker.device.id})`);
    context.emitEvent('STEP_STARTED', {
      testCaseId: 'init',
      stepOrder: 0,
      action: 'DEVICE_ALLOCATED',
      device: this.worker.device as any
    });
  }

  async executeTestCase(testCase: TestCase, context: ExecutionContext): Promise<TestEngineResult> {
    const startTime = Date.now();
    const stepResults: TestStepResult[] = [];
    context.log(`🚀 Executing mobile test case: "${testCase.title}" on ${this.worker?.device.name || 'Mobile Device'}`);
    context.emitEvent('TEST_STARTED', { testCaseId: testCase.id, title: testCase.title, device: this.worker?.device as any });

    if (!this.worker) {
      this.worker = await mobileDevicePool.acquireWorker({
        platform: this.options.platform,
        runId: context.runId
      });
    }

    let testStatus: TestResultStatus = TestResultStatus.PASSED;
    let errorMessage: string | undefined;

    for (const step of testCase.steps) {
      if (context.isCancelled) {
        context.log(`Test case cancelled by operator during step #${step.order}`);
        testStatus = TestResultStatus.CANCELLED;
        break;
      }

      const stepStartTime = Date.now();
      context.emitEvent('STEP_STARTED', {
        testCaseId: testCase.id,
        stepOrder: step.order,
        action: step.action,
        target: step.target,
        value: step.value
      });

      const execResult = await this.worker.executeStep({
        order: step.order,
        action: step.action,
        target: step.target || undefined,
        value: step.value || undefined,
        description: step.description || `Step ${step.order} - ${step.action}`
      });

      const durationMs = Date.now() - stepStartTime;

      if (execResult.status === 'FAILED') {
        testStatus = TestResultStatus.FAILED;
        errorMessage = execResult.error || `Failed executing mobile action ${step.action} on ${step.target}`;
        context.log(`❌ Step #${step.order} failed: ${errorMessage}`);

        // Capture screenshot on mobile failure
        try {
          const screenshotBuf = await this.worker.driver.captureScreenshot();
          context.addArtifact(
            'SCREENSHOT' as any,
            `failure_step_${step.order}.png`,
            screenshotBuf,
            'image/png'
          );
        } catch {}

        stepResults.push({
          stepId: step.id || `step-${step.order}`,
          order: step.order,
          action: step.action,
          target: step.target || '',
          status: 'FAILED',
          durationMs,
          error: errorMessage
        });

        context.emitEvent('STEP_COMPLETED', {
          testCaseId: testCase.id,
          stepOrder: step.order,
          status: 'FAILED',
          error: errorMessage,
          durationMs
        });

        break;
      } else {
        context.log(`✅ Step #${step.order} [${step.action}] completed in ${durationMs}ms`);
        stepResults.push({
          stepId: step.id || `step-${step.order}`,
          order: step.order,
          action: step.action,
          target: step.target || '',
          status: 'PASSED',
          durationMs
        });

        context.emitEvent('STEP_COMPLETED', {
          testCaseId: testCase.id,
          stepOrder: step.order,
          status: 'PASSED',
          durationMs
        });
      }
    }

    // Capture device logcat / syslog output as artifact
    try {
      const logs = await this.worker.driver.getDeviceLogs();
      if (logs.length > 0) {
        const logBuffer = Buffer.from(logs.join('\n'));
        context.addArtifact(
          'LOG' as any,
          `device_logs_${testCase.id}.txt`,
          logBuffer,
          'text/plain'
        );
      }
    } catch {}

    const totalDurationMs = Date.now() - startTime;
    context.emitEvent('TEST_COMPLETED', {
      testCaseId: testCase.id,
      status: testStatus,
      durationMs: totalDurationMs,
      error: errorMessage
    });

    return {
      status: testStatus,
      durationMs: totalDurationMs,
      errorMessage,
      stepResults
    };
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await mobileDevicePool.releaseWorker(this.worker);
      this.worker = null;
    }
    log.info('Mobile test engine worker released and cleaned up');
  }
}
