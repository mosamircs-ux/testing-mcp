import { Router, Request, Response } from 'express';
import { prisma } from '@novaqa/database';
import { workerQueue } from '@novaqa/worker';

export const metricsRouter = Router();

// Metrics tracking state
interface HttpMetric {
  count: number;
  totalDurationMs: number;
}

const requestMetrics = new Map<string, HttpMetric>();

export function recordHttpMetric(method: string, path: string, status: number, durationMs: number): void {
  // Normalize path to prevent cardinality explosion (e.g., replace IDs with :id)
  const normalizedPath = path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/c[a-z0-9]{24}/g, ':id');

  const key = `${method.toUpperCase()}_${normalizedPath}_${status}`;
  const existing = requestMetrics.get(key) || { count: 0, totalDurationMs: 0 };
  existing.count += 1;
  existing.totalDurationMs += durationMs;
  requestMetrics.set(key, existing);
}

metricsRouter.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const memory = process.memoryUsage();
    const uptimeSec = process.uptime();
    const workerStats = workerQueue.heartbeat();

    // Query high-level database counters
    const [totalRuns, passedRuns, failedRuns, totalMcpSessions, totalPayments] = await Promise.all([
      prisma.testRun.count(),
      prisma.testRun.count({ where: { status: 'PASSED' } }),
      prisma.testRun.count({ where: { status: 'FAILED' } }),
      prisma.mcpSession.count(),
      prisma.payment.count()
    ]);

    let output = `# HELP process_uptime_seconds The uptime of the Node.js process in seconds.\n`;
    output += `# TYPE process_uptime_seconds gauge\n`;
    output += `process_uptime_seconds ${uptimeSec.toFixed(2)}\n\n`;

    output += `# HELP process_memory_bytes Node.js process memory metrics.\n`;
    output += `# TYPE process_memory_bytes gauge\n`;
    output += `process_memory_bytes{type="heapTotal"} ${memory.heapTotal}\n`;
    output += `process_memory_bytes{type="heapUsed"} ${memory.heapUsed}\n`;
    output += `process_memory_bytes{type="rss"} ${memory.rss}\n`;
    output += `process_memory_bytes{type="external"} ${memory.external}\n\n`;

    output += `# HELP novaqa_worker_active_jobs Number of currently executing parallel worker jobs.\n`;
    output += `# TYPE novaqa_worker_active_jobs gauge\n`;
    output += `novaqa_worker_active_jobs ${workerStats.activeJobs}\n`;
    output += `novaqa_worker_max_concurrency ${workerStats.maxConcurrency}\n\n`;

    output += `# HELP novaqa_test_runs_total Total number of executed test runs.\n`;
    output += `# TYPE novaqa_test_runs_total counter\n`;
    output += `novaqa_test_runs_total{status="all"} ${totalRuns}\n`;
    output += `novaqa_test_runs_total{status="passed"} ${passedRuns}\n`;
    output += `novaqa_test_runs_total{status="failed"} ${failedRuns}\n\n`;

    output += `# HELP novaqa_mcp_sessions_total Active or recorded MCP client connections.\n`;
    output += `# TYPE novaqa_mcp_sessions_total gauge\n`;
    output += `novaqa_mcp_sessions_total ${totalMcpSessions}\n\n`;

    output += `# HELP novaqa_payment_transactions_total Total recorded payment transactions.\n`;
    output += `# TYPE novaqa_payment_transactions_total counter\n`;
    output += `novaqa_payment_transactions_total ${totalPayments}\n\n`;

    output += `# HELP http_requests_total Total number of HTTP requests processed by endpoint and status.\n`;
    output += `# TYPE http_requests_total counter\n`;

    for (const [key, metric] of requestMetrics.entries()) {
      const [method, path, status] = key.split('_');
      output += `http_requests_total{method="${method}",path="${path}",status="${status}"} ${metric.count}\n`;
    }

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(output);
  } catch (err: any) {
    res.status(500).send(`# Error collecting metrics: ${err.message}\n`);
  }
});
