import { Router } from 'express';
import { prisma } from '@novaqa/database';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'novaqa-api',
    uptimeSec: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/health/ready', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    });
  }
});

healthRouter.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});
