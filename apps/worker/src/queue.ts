import { prisma } from '@novaqa/database';
import { orchestrator } from '@novaqa/test-runner';
import { loadConfig, createChildLogger } from '@novaqa/shared';
import { TestRunStatus } from '@novaqa/types';

const log = createChildLogger('worker-queue');
const config = loadConfig();

export type JobType = 'EXECUTE_TEST_RUN' | 'PROCESS_SCHEDULED_RUNS' | 'AI_BATCH_GENERATE';

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface WorkerStats {
  activeJobs: number;
  maxConcurrency: number;
  lastHeartbeat: string;
  isRunning: boolean;
}

export class WorkerQueue {
  private activeJobs = new Set<string>();
  private maxConcurrency: number;
  private intervalTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatTime: Date = new Date();
  private isRunning = false;

  constructor(maxConcurrency = config.MAX_CONCURRENT_RUNS || 5) {
    this.maxConcurrency = maxConcurrency;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastHeartbeatTime = new Date();
    log.info({ maxConcurrency: this.maxConcurrency }, '🚀 NovaQA Worker Queue & Scheduler started');
    this.intervalTimer = setInterval(() => this.pollJobs(), 2000);
  }

  stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
    log.info('NovaQA Worker Queue stopped');
  }

  heartbeat(): WorkerStats {
    this.lastHeartbeatTime = new Date();
    return {
      activeJobs: this.activeJobs.size,
      maxConcurrency: this.maxConcurrency,
      lastHeartbeat: this.lastHeartbeatTime.toISOString(),
      isRunning: this.isRunning
    };
  }

  async pollJobs() {
    this.lastHeartbeatTime = new Date();

    // Check available concurrency slots
    const availableSlots = this.maxConcurrency - this.activeJobs.size;
    if (availableSlots <= 0) return;

    try {
      // Find up to availableSlots pending test runs
      const pendingRuns = await prisma.testRun.findMany({
        where: { status: TestRunStatus.QUEUED },
        orderBy: { createdAt: 'asc' },
        take: availableSlots
      });

      for (const run of pendingRuns) {
        if (this.activeJobs.has(run.id)) continue;

        this.activeJobs.add(run.id);
        log.info({ runId: run.id, currentActive: this.activeJobs.size }, 'Dispatching queued test run to orchestrator');

        // Execute asynchronously
        orchestrator
          .executeRun(run.id)
          .catch((err: any) => {
            log.error({ runId: run.id, err: err.message }, 'Test run execution encountered unhandled error');
          })
          .finally(() => {
            this.activeJobs.delete(run.id);
          });
      }
    } catch (err: any) {
      log.error({ err: err.message }, 'Error in worker job polling cycle');
    }
  }

  async cancelJob(runId: string, reason?: string): Promise<boolean> {
    log.info({ runId, reason }, 'Requesting cancellation for queued/running job');
    const cancelled = await orchestrator.cancelRun(runId, reason);
    this.activeJobs.delete(runId);
    return cancelled;
  }

  async dispatchTestRun(runId: string): Promise<void> {
    log.info({ runId }, 'Enqueueing test run');
    await prisma.testRun.update({
      where: { id: runId },
      data: { status: TestRunStatus.QUEUED }
    });
    // Trigger immediate polling cycle
    setImmediate(() => this.pollJobs());
  }
}

export const workerQueue = new WorkerQueue();
