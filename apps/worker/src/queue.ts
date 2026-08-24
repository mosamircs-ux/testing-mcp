import http from 'http';
import { prisma } from '@novaqa/database';
import { orchestrator } from '@novaqa/test-runner';
import { loadConfig, createChildLogger } from '@novaqa/shared';
import { TestRunStatus } from '@novaqa/types';

const log = createChildLogger('worker-queue');
const config = loadConfig();

export interface WorkerStats {
  activeJobs: number;
  maxConcurrency: number;
  lastHeartbeat: string;
  isRunning: boolean;
  totalProcessed: number;
  totalFailed: number;
  totalRetried: number;
  deadLetterCount: number;
}

export class WorkerQueue {
  private activeJobs = new Set<string>();
  private retryCounts = new Map<string, number>();
  private maxConcurrency: number;
  private maxRetries = 3;
  private intervalTimer: NodeJS.Timeout | null = null;
  private maintenanceTimer: NodeJS.Timeout | null = null;
  private healthServer: http.Server | null = null;
  private lastHeartbeatTime: Date = new Date();
  private isRunning = false;
  private totalProcessed = 0;
  private totalFailed = 0;
  private totalRetried = 0;
  private deadLetterCount = 0;

  constructor(maxConcurrency = config.MAX_CONCURRENT_RUNS || 5) {
    this.maxConcurrency = maxConcurrency;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastHeartbeatTime = new Date();
    log.info({ maxConcurrency: this.maxConcurrency }, '🚀 NovaQA Worker Queue & Scheduler started');

    // Main job polling loop (every 2s)
    this.intervalTimer = setInterval(() => this.pollJobs(), 2000);

    // Periodic artifact retention & maintenance cycle (every 6 hours)
    this.maintenanceTimer = setInterval(() => this.pruneExpiredArtifacts(), 6 * 60 * 60 * 1000);

    // Start Worker Health & Metrics HTTP Server
    this.startHealthServer();
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      log.info('Initiating graceful worker shutdown...');
      if (this.intervalTimer) {
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
      }
      if (this.maintenanceTimer) {
        clearInterval(this.maintenanceTimer);
        this.maintenanceTimer = null;
      }
      if (this.healthServer) {
        this.healthServer.close();
        this.healthServer = null;
      }

      this.isRunning = false;

      // Drain active jobs if any
      const drainInterval = setInterval(() => {
        if (this.activeJobs.size === 0) {
          clearInterval(drainInterval);
          log.info('All worker jobs drained. Worker stopped cleanly.');
          resolve();
        } else {
          log.info({ remainingActive: this.activeJobs.size }, 'Waiting for active jobs to complete...');
        }
      }, 500);

      // Force timeout after 15s
      setTimeout(() => {
        clearInterval(drainInterval);
        log.warn('Worker shutdown timed out after 15s. Forcing exit.');
        resolve();
      }, 15000);
    });
  }

  private startHealthServer() {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      return;
    }
    const port = Number(process.env.WORKER_PORT || 4001);
    this.healthServer = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/health/live') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'novaqa-worker', uptimeSec: process.uptime() }));
      } else if (req.url === '/health/ready') {
        res.writeHead(this.isRunning ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: this.isRunning ? 'ready' : 'not_ready', activeJobs: this.activeJobs.size }));
      } else if (req.url === '/metrics') {
        const stats = this.heartbeat();
        const output = `# HELP novaqa_worker_active_jobs Current parallel jobs in execution\n` +
          `# TYPE novaqa_worker_active_jobs gauge\n` +
          `novaqa_worker_active_jobs ${stats.activeJobs}\n\n` +
          `# HELP novaqa_worker_total_processed Total jobs processed\n` +
          `# TYPE novaqa_worker_total_processed counter\n` +
          `novaqa_worker_total_processed ${stats.totalProcessed}\n\n` +
          `# HELP novaqa_worker_dead_letter_total Total jobs moved to dead letter queue\n` +
          `# TYPE novaqa_worker_dead_letter_total counter\n` +
          `novaqa_worker_dead_letter_total ${stats.deadLetterCount}\n`;
        res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
        res.end(output);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.healthServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log.warn({ port }, 'Worker health port already in use. Skipping server bind.');
      } else {
        log.error({ err }, 'Worker health server error');
      }
    });

    this.healthServer.listen(port, () => {
      log.info({ port }, 'Worker health and metrics endpoint listening');
    });
  }

  heartbeat(): WorkerStats {
    this.lastHeartbeatTime = new Date();
    return {
      activeJobs: this.activeJobs.size,
      maxConcurrency: this.maxConcurrency,
      lastHeartbeat: this.lastHeartbeatTime.toISOString(),
      isRunning: this.isRunning,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
      totalRetried: this.totalRetried,
      deadLetterCount: this.deadLetterCount
    };
  }

  async pollJobs() {
    this.lastHeartbeatTime = new Date();

    const availableSlots = this.maxConcurrency - this.activeJobs.size;
    if (availableSlots <= 0) return;

    try {
      const pendingRuns = await prisma.testRun.findMany({
        where: { status: TestRunStatus.QUEUED },
        orderBy: { createdAt: 'asc' },
        take: availableSlots
      });

      for (const run of pendingRuns) {
        if (this.activeJobs.has(run.id)) continue;

        this.activeJobs.add(run.id);
        log.info({ runId: run.id, currentActive: this.activeJobs.size }, 'Dispatching queued test run to orchestrator');

        this.executeWithRetry(run.id);
      }
    } catch (err: any) {
      log.error({ err: err.message }, 'Error in worker job polling cycle');
    }
  }

  private async executeWithRetry(runId: string) {
    try {
      await orchestrator.executeRun(runId);
      this.totalProcessed += 1;
      this.retryCounts.delete(runId);
    } catch (err: any) {
      this.totalFailed += 1;
      const currentAttempts = (this.retryCounts.get(runId) || 0) + 1;
      this.retryCounts.set(runId, currentAttempts);

      if (currentAttempts <= this.maxRetries) {
        this.totalRetried += 1;
        const backoffMs = Math.pow(2, currentAttempts) * 1500; // 3s, 6s, 12s
        log.warn(
          { runId, attempt: currentAttempts, maxRetries: this.maxRetries, retryInMs: backoffMs, err: err.message },
          'Job failed with retryable error. Scheduling backoff retry'
        );

        setTimeout(() => {
          this.activeJobs.delete(runId);
          this.dispatchTestRun(runId);
        }, backoffMs);
        return;
      } else {
        // Exceeded max retries -> Move to Dead-Letter Queue / Final Error state
        this.deadLetterCount += 1;
        log.error(
          { runId, attempts: currentAttempts, err: err.message },
          'Job exceeded max retries. Moving to Dead-Letter state'
        );

        await prisma.testRun.update({
          where: { id: runId },
          data: {
            status: TestRunStatus.FAILED,
            completedAt: new Date()
          }
        });
        this.retryCounts.delete(runId);
      }
    } finally {
      this.activeJobs.delete(runId);
    }
  }

  async pruneExpiredArtifacts(): Promise<void> {
    try {
      log.info('Running periodic artifact lifecycle retention pruning...');
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days default

      const pruned = await prisma.artifact.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      });

      if (pruned.count > 0) {
        log.info({ deletedArtifactsCount: pruned.count }, 'Pruned expired artifacts');
      }
    } catch (err: any) {
      log.error({ err: err.message }, 'Failed to prune expired artifacts');
    }
  }

  async cancelJob(runId: string, reason?: string): Promise<boolean> {
    log.info({ runId, reason }, 'Requesting cancellation for queued/running job');
    const cancelled = await orchestrator.cancelRun(runId, reason);
    this.activeJobs.delete(runId);
    this.retryCounts.delete(runId);
    return cancelled;
  }

  async dispatchTestRun(runId: string): Promise<void> {
    log.info({ runId }, 'Enqueueing test run');
    await prisma.testRun.update({
      where: { id: runId },
      data: { status: TestRunStatus.QUEUED }
    });
    setImmediate(() => this.pollJobs());
  }
}

export const workerQueue = new WorkerQueue();
