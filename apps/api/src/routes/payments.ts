import { Router, Request, Response, NextFunction } from 'express';
import { paymobService, PlanSlug, BillingInterval } from '@novaqa/auth';
import { prisma } from '@novaqa/database';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { NotFoundError, BadRequestError } from '@novaqa/shared';

export const paymentsRouter = Router();

const CreatePaymobPaymentSchema = z.object({
  planSlug: z.nativeEnum(PlanSlug),
  interval: z.enum(['monthly', 'yearly']).optional().default('monthly'),
  returnUrl: z.string().url().optional(),
  customerInfo: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional()
    })
    .optional()
});

const RefundPaymentSchema = z.object({
  amountCents: z.number().positive().optional(),
  reason: z.string().optional()
});

// ============================================================================
// 1. POST /api/payments/paymob/create (and /api/v1/payments/paymob/create)
// ============================================================================
const handleCreatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.auth!.organizationId;
    const userId = req.auth!.userId;
    const input = CreatePaymobPaymentSchema.parse(req.body);

    const result = await paymobService.createPaymentIntention({
      organizationId: orgId,
      userId,
      planSlug: input.planSlug,
      interval: input.interval as BillingInterval,
      returnUrl: input.returnUrl,
      customerInfo: input.customerInfo
    });

    res.status(201).json({
      success: true,
      message: 'Paymob payment intention created successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

paymentsRouter.post('/api/payments/paymob/create', authMiddleware, requirePermission('billing.manage'), handleCreatePayment);
paymentsRouter.post('/api/v1/payments/paymob/create', authMiddleware, requirePermission('billing.manage'), handleCreatePayment);

// ============================================================================
// 2. POST /api/payments/paymob/webhook (and /api/v1/payments/paymob/webhook)
// ============================================================================
const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = req.body;
    const hmacSignature = (req.query.hmac as string) || (req.headers['x-paymob-hmac'] as string) || payload.hmac;

    const result = await paymobService.processWebhook(payload, hmacSignature);

    if (!result.success && result.status === 'UNAUTHORIZED') {
      res.status(401).json({ success: false, message: 'Invalid HMAC signature', error: result.errorReason });
      return;
    }

    if (!result.success && result.status === 'AMOUNT_MISMATCH') {
      res.status(422).json({ success: false, message: 'Payment validation mismatch', error: result.errorReason });
      return;
    }

    res.status(200).json({
      success: result.success,
      status: result.status,
      idempotent: result.idempotent,
      paymentId: result.paymentId,
      subscriptionActivated: result.subscriptionActivated
    });
  } catch (err) {
    next(err);
  }
};

// Webhook endpoints must be publicly accessible for Paymob callbacks
paymentsRouter.post('/api/payments/paymob/webhook', handleWebhook);
paymentsRouter.post('/api/v1/payments/paymob/webhook', handleWebhook);

// ============================================================================
// 3. GET /api/payments/:id (and /api/v1/payments/:id)
// ============================================================================
const handleGetPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const orgId = req.auth!.organizationId;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        organizationId: orgId
      },
      include: {
        invoice: true,
        refunds: true
      }
    });

    if (!payment) {
      throw new NotFoundError('Payment', id);
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        merchantReference: payment.merchantReference,
        paymobIntentionId: payment.paymobIntentionId,
        paymobTransactionId: payment.paymobTransactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        targetPlanSlug: payment.targetPlanSlug,
        targetInterval: payment.targetInterval,
        checkoutUrl: payment.checkoutUrl,
        reconciledAt: payment.reconciledAt,
        errorMessage: payment.errorMessage,
        invoice: payment.invoice,
        refunds: payment.refunds,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

paymentsRouter.get('/api/payments/:id', authMiddleware, requirePermission('billing.read'), handleGetPayment);
paymentsRouter.get('/api/v1/payments/:id', authMiddleware, requirePermission('billing.read'), handleGetPayment);

// ============================================================================
// 4. GET /api/billing/subscription (and /api/v1/billing/subscription)
// ============================================================================
const handleGetSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.auth!.organizationId;
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
      include: {
        plan: { include: { features: true } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    if (!subscription) {
      throw new NotFoundError('Subscription for organization', orgId);
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (err) {
    next(err);
  }
};

paymentsRouter.get('/api/billing/subscription', authMiddleware, requirePermission('billing.read'), handleGetSubscription);
paymentsRouter.get('/api/v1/billing/subscription', authMiddleware, requirePermission('billing.read'), handleGetSubscription);

// ============================================================================
// 5. Admin Payment Management & Reconciliation
// ============================================================================

// List all payments for organization (or admin overview)
paymentsRouter.get(
  '/api/v1/payments',
  authMiddleware,
  requirePermission('billing.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.auth!.organizationId;
      const payments = await prisma.payment.findMany({
        where: { organizationId: orgId },
        include: { invoice: true, refunds: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  }
);

// Reconcile pending transaction against Paymob API
paymentsRouter.post(
  '/api/v1/payments/:id/reconcile',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const result = await paymobService.reconcilePayment(id);
      res.json({ success: true, message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Refund payment
paymentsRouter.post(
  '/api/v1/payments/:id/refund',
  authMiddleware,
  requirePermission('billing.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const input = RefundPaymentSchema.parse(req.body);
      const refund = await paymobService.refundPayment(id, input.amountCents, input.reason);
      res.json({ success: true, message: 'Refund processed successfully', data: refund });
    } catch (err) {
      next(err);
    }
  }
);
