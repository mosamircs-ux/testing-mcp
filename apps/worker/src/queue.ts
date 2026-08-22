import { prisma } from '@novaqa/database';
import { orchestrator } from '@novaqa/test-runner';
import { createChildLogger } from '@novaqa/shared';
import { TestRunStatus } from '@novaqa/types';

const log = createChildLogger('worker-queue');

export type JobType = 'EXECUTE_TEST_RUN' | 'PROCESS_SCHEDULED_RUNS' | 'AI_BATCH_GENERATE';

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export class WorkerQueue {
  private isProcessing = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  start() {
    log.info('🚀 NovaQA Worker Queue started');
    this.intervalTimer = setInterval(() => this.pollJobs(), 3000);
  }

  stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    log.info('NovaQA Worker Queue stopped');
  }

  async pollJobs() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Find pending test runs
      const pendingRun = await prisma.testRun.findFirst({
        where: { status: TestRunStatus.QUEUED },
        orderBy: { createdAt: 'asc' }
      });

      if (pendingRun) {
        log.info({ runId: pendingRun.id }, 'Processing queued test run');
        await orchestrator.executeRun(pendingRun.id);
      }
    } catch (err: any) {
      log.error({ err: err.message }, 'Error in worker job processing cycle');
    } finally {
      this.isProcessing = false;
    }
  }

  async dispatchTestRun(runId: string): Promise<void> {
    log.info({ runId }, 'Enqueueing test run');
    await prisma.testRun.update({
      where: { id: runId },
      data: { status: TestRunStatus.QUEUED }
    });
    // Trigger immediate poll
    setImmediate(() => this.pollJobs());
  }
}

export const workerQueue = new WorkerQueue();
