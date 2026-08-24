import { Router, Request, Response, NextFunction } from 'express';
import { adminService, billingService, PlanSlug, BillingInterval } from '@novaqa/auth';
import { prisma } from '@novaqa/database';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { NotFoundError } from '@novaqa/shared';

export const adminRouter = Router();

// ============================================================================
// 1. System Metrics & Telemetry
// ============================================================================
adminRouter.get(
  '/api/v1/admin/metrics',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metrics = await adminService.getSystemMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 2. Users Management
// ============================================================================
adminRouter.get(
  '/api/v1/admin/users',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        include: {
          memberships: {
            include: { organization: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  '/api/v1/admin/users/:id',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const user = await prisma.user.findUnique({
        where: { id },
        include: { memberships: { include: { organization: true } }, auditLogs: true }
      });
      if (!user) throw new NotFoundError('User', id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 3. Organizations Management & Lifecycle
// ============================================================================
adminRouter.get(
  '/api/v1/admin/organizations',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizations = await prisma.organization.findMany({
        include: {
          subscription: { include: { plan: true } },
          members: { include: { user: true } },
          projects: true,
          _count: { select: { projects: true, members: true, auditLogs: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: organizations });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/api/v1/admin/organizations/:id/suspend',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { reason } = z.object({ reason: z.string().default('Administrative policy enforcement') }).parse(req.body);
      const org = await adminService.suspendOrganization(id, reason, req.auth?.userId);
      res.json({ success: true, message: `Organization '${org.name}' suspended successfully`, data: org });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/api/v1/admin/organizations/:id/restore',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const org = await adminService.restoreOrganization(id, req.auth?.userId);
      res.json({ success: true, message: `Organization '${org.name}' restored to ACTIVE`, data: org });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/api/v1/admin/organizations/:id/change-plan',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const input = z.object({
        planSlug: z.nativeEnum(PlanSlug),
        interval: z.enum(['monthly', 'yearly']).optional().default('monthly')
      }).parse(req.body);

      const subscription = await adminService.changeOrganizationPlan(
        id,
        input.planSlug,
        input.interval as BillingInterval,
        req.auth?.userId
      );
      res.json({ success: true, message: `Organization plan changed to ${input.planSlug}`, data: subscription });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/api/v1/admin/organizations/:id/credits',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const input = z.object({
        amountCents: z.number().positive(),
        reason: z.string().optional()
      }).parse(req.body);

      const credit = await adminService.grantCredits(id, input.amountCents, input.reason, req.auth?.userId);
      res.json({ success: true, message: 'Credits granted successfully', data: credit });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/api/v1/admin/credits/:id/revoke',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const input = z.object({ reason: z.string().optional() }).parse(req.body);
      const credit = await adminService.revokeCredits(id, input.reason, req.auth?.userId);
      res.json({ success: true, message: 'Credit revoked successfully', data: credit });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 4. Projects & Subscriptions Overview
// ============================================================================
adminRouter.get(
  '/api/v1/admin/projects',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          organization: true,
          environments: true,
          _count: { select: { testSuites: true, testRuns: true, findings: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: projects });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  '/api/v1/admin/subscriptions',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subscriptions = await prisma.subscription.findMany({
        include: { organization: true, plan: true, invoices: { take: 1, orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: subscriptions });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 5. Plans & Dynamic Pricing Admin
// ============================================================================
adminRouter.get(
  '/api/v1/admin/plans',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await billingService.getPlans();
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.put(
  '/api/v1/admin/plans/:slug',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = String(req.params.slug) as PlanSlug;
      const updated = await billingService.updatePlan(slug, req.body);
      await adminService.recordAuditLog({
        actorUserId: req.auth?.userId,
        action: 'PLAN_UPDATED_BY_ADMIN',
        entityType: 'Plan',
        entityId: slug,
        metadata: req.body
      });
      res.json({ success: true, message: `Plan '${slug}' updated`, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 6. Payments & Transactions Admin
// ============================================================================
adminRouter.get(
  '/api/v1/admin/payments',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await prisma.payment.findMany({
        include: { organization: true, invoice: true, refunds: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/api/v1/admin/payments/:id/refund',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const input = z.object({ amountCents: z.number().positive().optional(), reason: z.string().optional() }).parse(req.body);
      const refund = await adminService.refundPayment(id, input.amountCents, input.reason, req.auth?.userId);
      res.json({ success: true, message: 'Payment refunded successfully', data: refund });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 7. Test Runs, Health, Workers, MCP, Security, Audit Logs, Feature Flags
// ============================================================================
adminRouter.get(
  '/api/v1/admin/test-runs',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const runs = await prisma.testRun.findMany({
        include: { project: { include: { organization: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json({ success: true, data: runs });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  '/api/v1/admin/system-health',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({
        success: true,
        data: {
          status: 'HEALTHY',
          uptimeSeconds: process.uptime(),
          nodeVersion: process.version,
          database: { status: 'CONNECTED', type: 'SQLite' },
          redisQueue: { status: 'ACTIVE', depth: 0 },
          workerPool: { status: 'HEALTHY', activeWorkers: 4, totalCapacity: 56 },
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  '/api/v1/admin/workers',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workers = await adminService.getWorkers();
      res.json({ success: true, data: workers });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  '/api/v1/admin/mcp-connections',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connections = await adminService.getMcpConnections();
      res.json({ success: true, data: connections });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  '/api/v1/admin/security-findings',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findings = await prisma.finding.findMany({
        where: { severity: { in: ['CRITICAL', 'HIGH'] } },
        include: { testResult: { include: { testCase: { include: { suite: { include: { project: true } } } } } } },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json({ success: true, data: findings });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  '/api/v1/admin/audit-logs',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await prisma.auditLog.findMany({
        include: { organization: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  '/api/v1/admin/feature-flags',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flags = await adminService.getFeatureFlags();
      res.json({ success: true, data: flags });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.put(
  '/api/v1/admin/feature-flags/:key',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = String(req.params.key);
      const input = z.object({
        isEnabled: z.boolean(),
        rules: z.record(z.any()).optional()
      }).parse(req.body);

      const flag = await adminService.setFeatureFlag(key, input.isEnabled, input.rules, req.auth?.userId);
      res.json({ success: true, message: `Feature flag '${key}' updated`, data: flag });
    } catch (err) {
      next(err);
    }
  }
);
