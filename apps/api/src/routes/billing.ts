import { Router, Request, Response, NextFunction } from 'express';
import { billingService, PlanSlug, BillingInterval } from '@novaqa/auth';
import { prisma } from '@novaqa/database';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '@novaqa/shared';

export const billingRouter = Router();

// ============================================================================
// 1. Public Plans Endpoints (Accessible publicly for landing page, pricing, and checkout)
// ============================================================================

// List all active dynamic plans from database
const handleGetPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plans = await billingService.getPlans();
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

billingRouter.get('/api/v1/plans', handleGetPlans);
billingRouter.get('/api/v1/billing/plans', handleGetPlans);

// Get single plan by slug
billingRouter.get('/api/v1/plans/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slug = String(req.params.slug).toUpperCase() as PlanSlug;
    await billingService.seedDefaultPlans();
    const plan = await prisma.plan.findUnique({
      where: { slug },
      include: { features: true }
    });
    if (!plan) {
      throw new NotFoundError('Plan', slug);
    }
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// Apply auth middleware to subsequent tenant billing routes
billingRouter.use(authMiddleware);

const ChangeSubscriptionSchema = z.object({
  planSlug: z.nativeEnum(PlanSlug),
  interval: z.enum(['monthly', 'yearly']).optional().default('monthly')
});

const UpdatePlanAdminSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  priceMonthly: z.number().optional(),
  priceYearly: z.number().optional(),
  limits: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

const CancelSubscriptionSchema = z.object({
  cancelImmediately: z.boolean().optional().default(false)
});

const GrantCreditSchema = z.object({
  amount: z.number().positive(),
  reason: z.string()
});

const IssueRefundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive(),
  reason: z.string()
});

// Admin update plan pricing & limits in database
billingRouter.put(
  '/api/v1/billing/admin/plans/:slug',
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = String(req.params.slug) as PlanSlug;
      const input = UpdatePlanAdminSchema.parse(req.body);
      const updated = await billingService.updatePlan(slug, input);
      res.json({ success: true, message: 'Plan limits & pricing updated', data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 2. Subscription Management
// ============================================================================

// Get current organization subscription
billingRouter.get(
  '/api/v1/billing/subscription',
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const subscription = await billingService.getOrganizationSubscription(orgId);
      res.json({ success: true, data: subscription });
    } catch (err) {
      next(err);
    }
  }
);

// Upgrade / Change subscription plan
billingRouter.post(
  '/api/v1/billing/subscription/upgrade',
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const input = ChangeSubscriptionSchema.parse(req.body);
      const updated = await billingService.changeSubscription(orgId, input.planSlug, input.interval as BillingInterval);
      res.json({ success: true, message: `Successfully upgraded to ${input.planSlug} tier`, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Downgrade subscription plan
billingRouter.post(
  '/api/v1/billing/subscription/downgrade',
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const input = ChangeSubscriptionSchema.parse(req.body);
      const updated = await billingService.changeSubscription(orgId, input.planSlug, input.interval as BillingInterval);
      res.json({ success: true, message: `Successfully updated plan to ${input.planSlug}`, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Activate Free Community Tier directly (zero cost)
billingRouter.post(
  '/api/v1/billing/activate-free',
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const updated = await billingService.changeSubscription(orgId, PlanSlug.FREE, 'monthly');
      res.json({
        success: true,
        message: 'Free Community Tier activated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

// Cancel subscription
billingRouter.post(
  '/api/v1/billing/subscription/cancel',
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const input = CancelSubscriptionSchema.parse(req.body);
      const cancelled = await billingService.cancelSubscription(orgId, input.cancelImmediately);
      res.json({ success: true, message: 'Subscription successfully updated', data: cancelled });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 3. 9-Dimension Usage & Quota Metrics
// ============================================================================

// Get detailed usage snapshot across all 9 tracked dimensions
billingRouter.get(
  '/api/v1/billing/usage',
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const usage = await billingService.getUsageSnapshot(orgId);
      res.json({ success: true, data: usage });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 4. Invoices, Payments, Credits & Refunds
// ============================================================================

// List invoices and payment history
billingRouter.get(
  '/api/v1/billing/invoices',
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const invoices = await billingService.getInvoices(orgId);
      res.json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  }
);

// Grant credit
billingRouter.post(
  '/api/v1/billing/credits',
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const input = GrantCreditSchema.parse(req.body);
      const credit = await billingService.grantCredit(orgId, input.amount, input.reason);
      res.json({ success: true, message: 'Credit granted successfully', data: credit });
    } catch (err) {
      next(err);
    }
  }
);

// Issue refund
billingRouter.post(
  '/api/v1/billing/refunds',
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const input = IssueRefundSchema.parse(req.body);
      const refund = await billingService.issueRefund(orgId, input.paymentId, input.amount, input.reason);
      res.json({ success: true, message: 'Refund issued successfully', data: refund });
    } catch (err) {
      next(err);
    }
  }
);
