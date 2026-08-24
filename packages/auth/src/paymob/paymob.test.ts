import { describe, it, expect, beforeAll } from 'vitest';
import { paymobService, PlanSlug, billingService } from '../index.js';
import { prisma } from '@novaqa/database';
import { PaymobTransactionObj, PaymobWebhookPayload } from './types.js';

describe('Paymob Intention & Unified Checkout SaaS Integration (@novaqa/auth/paymob)', () => {
  let testOrgId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize default dynamic plans
    await billingService.seedDefaultPlans();

    const user = await prisma.user.create({
      data: {
        email: `paymob-user-${Date.now()}@example.com`,
        name: 'Paymob Test User',
        passwordHash: 'hashed_password_123'
      }
    });
    testUserId = user.id;

    const org = await prisma.organization.create({
      data: {
        name: 'Paymob Enterprise Corp',
        slug: `paymob-org-${Date.now()}`,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });
    testOrgId = org.id;
  });

  it('1. User selects subscription -> creates pending payment & Paymob payment intention', async () => {
    const result = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testUserId,
      planSlug: PlanSlug.PRO,
      interval: 'monthly',
      customerInfo: {
        firstName: 'Samir',
        lastName: 'Mohamed',
        email: 'samir@example.com',
        phone: '+201012345678'
      }
    });

    expect(result.paymentId).toBeDefined();
    expect(result.merchantReference).toMatch(/^pmt_/);
    expect(result.clientSecret).toBeDefined();
    expect(result.unifiedCheckoutUrl).toContain('clientSecret=');
    expect(result.publicKey).toBeDefined();
    expect(result.amount).toBe(7900); // $79.00 in cents
    expect(result.currency).toBe('USD');

    // Verify payment is stored in DB with PENDING status
    const payment = await prisma.payment.findUnique({ where: { id: result.paymentId } });
    expect(payment).toBeDefined();
    expect(payment?.status).toBe('PENDING');
    expect(payment?.paymobIntentionId).toBeDefined();
    expect(payment?.merchantReference).toBe(result.merchantReference);

    // Verify subscription is NOT active yet (still on free tier until verified payment)
    const sub = await billingService.getOrganizationSubscription(testOrgId);
    expect(sub.plan.slug).toBe(PlanSlug.FREE);
  });

  it('2. Paymob calls webhook with valid HMAC -> updates payment & activates subscription', async () => {
    // 1. Create payment intention
    const creation = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testUserId,
      planSlug: PlanSlug.TEAM,
      interval: 'monthly'
    });

    // 2. Mock Paymob successful transaction object
    const txObj: PaymobTransactionObj = {
      id: 987654321,
      amount_cents: 19900, // $199.00
      currency: 'USD',
      success: true,
      pending: false,
      special_reference: creation.merchantReference,
      created_at: new Date().toISOString(),
      order: { id: 112233, merchant_order_id: creation.merchantReference },
      owner: 456,
      source_data: { pan: '2345', sub_type: 'MasterCard', type: 'card' }
    };

    // 3. Generate valid HMAC signature
    const validHmac = paymobService.getVerifier().generateHmac(txObj);

    const payload: PaymobWebhookPayload = {
      type: 'TRANSACTION',
      obj: txObj,
      hmac: validHmac
    };

    // 4. Process webhook
    const res = await paymobService.processWebhook(payload, validHmac);

    expect(res.success).toBe(true);
    expect(res.status).toBe('SUCCEEDED');
    expect(res.subscriptionActivated).toBe(true);

    // Verify payment in DB
    const updatedPayment = await prisma.payment.findUnique({ where: { id: creation.paymentId } });
    expect(updatedPayment?.status).toBe('SUCCEEDED');
    expect(updatedPayment?.paymobTransactionId).toBe('987654321');

    // Verify subscription is now activated to TEAM tier
    const sub = await billingService.getOrganizationSubscription(testOrgId);
    expect(sub.plan.slug).toBe(PlanSlug.TEAM);
  });

  it('3. Duplicate webhook -> returns idempotent response without duplicate subscription activation', async () => {
    const creation = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testUserId,
      planSlug: PlanSlug.STARTER,
      interval: 'monthly'
    });

    const txObj: PaymobTransactionObj = {
      id: 99887766,
      amount_cents: creation.amount,
      currency: 'USD',
      success: true,
      pending: false,
      special_reference: creation.merchantReference,
      created_at: new Date().toISOString()
    };

    const hmac = paymobService.getVerifier().generateHmac(txObj);
    const payload: PaymobWebhookPayload = { type: 'TRANSACTION', obj: txObj, hmac };

    // First delivery
    const firstRes = await paymobService.processWebhook(payload, hmac);
    expect(firstRes.success).toBe(true);
    expect(firstRes.subscriptionActivated).toBe(true);

    // Second delivery (duplicate retry from Paymob)
    const duplicateRes = await paymobService.processWebhook(payload, hmac);
    expect(duplicateRes.success).toBe(true);
    expect(duplicateRes.idempotent).toBe(true);
    expect(duplicateRes.subscriptionActivated).toBe(false); // Does NOT re-activate or double-apply
  });

  it('4. Invalid webhook (tampered HMAC) -> rejected with 401 / UNAUTHORIZED', async () => {
    const txObj: PaymobTransactionObj = {
      id: 111222,
      amount_cents: 7900,
      currency: 'USD',
      success: true,
      pending: false,
      created_at: new Date().toISOString()
    };

    const payload: PaymobWebhookPayload = { type: 'TRANSACTION', obj: txObj };
    const invalidHmac = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

    const res = await paymobService.processWebhook(payload, invalidHmac);
    expect(res.success).toBe(false);
    expect(res.status).toBe('UNAUTHORIZED');
    expect(res.subscriptionActivated).toBe(false);
  });

  it('5. Wrong amount tampering -> rejected and marked FAILED', async () => {
    const creation = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testUserId,
      planSlug: PlanSlug.PRO, // $79.00 (7900 cents)
      interval: 'monthly'
    });

    const tamperedTxObj: PaymobTransactionObj = {
      id: 445566,
      amount_cents: 100, // Attacker manipulated amount to $1.00
      currency: 'USD',
      success: true,
      pending: false,
      special_reference: creation.merchantReference,
      created_at: new Date().toISOString()
    };

    const hmac = paymobService.getVerifier().generateHmac(tamperedTxObj);
    const payload: PaymobWebhookPayload = { type: 'TRANSACTION', obj: tamperedTxObj, hmac };

    const res = await paymobService.processWebhook(payload, hmac);
    expect(res.success).toBe(false);
    expect(res.status).toBe('AMOUNT_MISMATCH');
    expect(res.subscriptionActivated).toBe(false);

    const payment = await prisma.payment.findUnique({ where: { id: creation.paymentId } });
    expect(payment?.status).toBe('FAILED');
    expect(payment?.errorMessage).toContain('Amount or currency mismatch');
  });

  it('6. Wrong currency tampering -> rejected and marked FAILED', async () => {
    const creation = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testUserId,
      planSlug: PlanSlug.PRO, // USD
      interval: 'monthly'
    });

    const tamperedTxObj: PaymobTransactionObj = {
      id: 556677,
      amount_cents: creation.amount,
      currency: 'EGP', // Mismatched currency
      success: true,
      pending: false,
      special_reference: creation.merchantReference,
      created_at: new Date().toISOString()
    };

    const hmac = paymobService.getVerifier().generateHmac(tamperedTxObj);
    const payload: PaymobWebhookPayload = { type: 'TRANSACTION', obj: tamperedTxObj, hmac };

    const res = await paymobService.processWebhook(payload, hmac);
    expect(res.success).toBe(false);
    expect(res.status).toBe('AMOUNT_MISMATCH');
  });

  it('7. Failed / Declined payment callback -> updates status to FAILED', async () => {
    const creation = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testUserId,
      planSlug: PlanSlug.STARTER,
      interval: 'monthly'
    });

    const failedTxObj: PaymobTransactionObj = {
      id: 778899,
      amount_cents: creation.amount,
      currency: 'USD',
      success: false,
      pending: false,
      error_occured: true,
      special_reference: creation.merchantReference,
      created_at: new Date().toISOString(),
      data: { message: 'Insufficient funds on card' }
    };

    const hmac = paymobService.getVerifier().generateHmac(failedTxObj);
    const payload: PaymobWebhookPayload = { type: 'TRANSACTION', obj: failedTxObj, hmac };

    const res = await paymobService.processWebhook(payload, hmac);
    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');

    const payment = await prisma.payment.findUnique({ where: { id: creation.paymentId } });
    expect(payment?.status).toBe('FAILED');
    expect(payment?.errorMessage).toBe('Insufficient funds on card');
  });

  it('8. Transaction reconciliation -> resolves stalled pending payment', async () => {
    const creation = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testUserId,
      planSlug: PlanSlug.BUSINESS,
      interval: 'monthly'
    });

    // Reconcile transaction
    const reconciliation = await paymobService.reconcilePayment(creation.paymentId);
    expect(reconciliation.isReconciled).toBe(true);
    expect(reconciliation.currentStatus).toBe('SUCCEEDED');
    expect(reconciliation.subscriptionActivated).toBe(true);

    const sub = await billingService.getOrganizationSubscription(testOrgId);
    expect(sub.plan.slug).toBe(PlanSlug.BUSINESS);
  });

  it('9. Refund payment -> calls Paymob refund and updates payment status to REFUNDED', async () => {
    // Create and succeed a payment
    const creation = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testUserId,
      planSlug: PlanSlug.PRO,
      interval: 'monthly'
    });

    const txObj: PaymobTransactionObj = {
      id: 33445566,
      amount_cents: 7900,
      currency: 'USD',
      success: true,
      pending: false,
      special_reference: creation.merchantReference,
      created_at: new Date().toISOString()
    };

    const hmac = paymobService.getVerifier().generateHmac(txObj);
    await paymobService.processWebhook({ type: 'TRANSACTION', obj: txObj, hmac }, hmac);

    // Issue refund
    const refund = await paymobService.refundPayment(creation.paymentId, 7900, 'Customer requested cancellation');
    expect(refund.amount).toBe(7900);
    expect(refund.status).toBe('SUCCEEDED');

    const payment = await prisma.payment.findUnique({ where: { id: creation.paymentId } });
    expect(payment?.status).toBe('REFUNDED');
  });

  it('10. Subscription cancellation -> sets cancelAtPeriodEnd or downgrades cleanly', async () => {
    const cancelled = await billingService.cancelSubscription(testOrgId, false);
    expect(cancelled.cancelAtPeriodEnd).toBe(true);

    const immediate = await billingService.cancelSubscription(testOrgId, true);
    expect(immediate.status).toBe('cancelled');
  });
});
