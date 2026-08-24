import { describe, it, expect } from 'vitest';
import { WorkerQueue } from './queue.js';

describe('Worker Queue & Concurrency Engine', () => {
  it('should report worker heartbeats and concurrency limits', () => {
    const queue = new WorkerQueue(8);
    const stats = queue.heartbeat();

    expect(stats.maxConcurrency).toBe(8);
    expect(stats.activeJobs).toBe(0);
    expect(typeof stats.lastHeartbeat).toBe('string');
  });

  it('should start and stop polling cleanly', () => {
    const queue = new WorkerQueue(4);
    queue.start();
    const statsRunning = queue.heartbeat();
    expect(statsRunning.isRunning).toBe(true);

    queue.stop();
    const statsStopped = queue.heartbeat();
    expect(statsStopped.isRunning).toBe(false);
  });
});
