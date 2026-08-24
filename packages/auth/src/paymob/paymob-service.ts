import { prisma } from '@novaqa/database';
import { createChildLogger } from '@novaqa/shared';
import { PaymobClient } from './paymob-client.js';
import { PaymobHmacVerifier } from './hmac-verifier.js';
import { billingService } from '../billing-service.js';
import {
  PaymobPaymentCreationResult,
  PaymobWebhookPayload,
  PaymobTransactionObj,
  ReconciliationResult
} from './types.js';
import { PlanSlug, BillingInterval } from '../billing-types.js';

const log = createChildLogger('paymob-service');

export class PaymobService {
  private client: PaymobClient;
  private verifier: PaymobHmacVerifier;

  constructor(client?: PaymobClient, verifier?: PaymobHmacVerifier) {
    this.client = client || new PaymobClient();
    this.verifier = verifier || new PaymobHmacVerifier();
  }

  getClient(): PaymobClient {
    return this.client;
  }

  getVerifier(): PaymobHmacVerifier {
    return this.verifier;
  }

  /**
   * 1. Creates a pending payment and generates a Paymob Payment Intention with Unified Checkout URL.
   */
  async createPaymentIntention(params: {
    organizationId: string;
    userId: string;
    planSlug: PlanSlug;
    interval?: BillingInterval;
    returnUrl?: string;
    customerInfo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    };
  }): Promise<PaymobPaymentCreationResult> {
    const interval = params.interval || 'monthly';
    const plan = await prisma.plan.findUnique({ where: { slug: params.planSlug } });

    if (!plan) {
      throw new Error(`Plan '${params.planSlug}' not found.`);
    }

    const amountInCents = interval === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    if (amountInCents <= 0) {
      throw new Error(`Cannot initialize Paymob payment for free tier '${params.planSlug}'.`);
    }

    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    const merchantReference = `pmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create pending payment in database
    const payment = await prisma.payment.create({
      data: {
        organizationId: params.organizationId,
        merchantReference,
        amount: amountInCents,
        currency: plan.currency || 'USD',
        status: 'PENDING',
        targetPlanSlug: params.planSlug,
        targetInterval: interval
      }
    });

    const firstName = params.customerInfo?.firstName || user?.name.split(' ')[0] || 'Customer';
    const lastName = params.customerInfo?.lastName || user?.name.split(' ').slice(1).join(' ') || 'User';
    const email = params.customerInfo?.email || user?.email || 'billing@example.com';
    const phone = params.customerInfo?.phone || '+201000000000';

    // Call Paymob Intention API
    const intention = await this.client.createIntention({
      amount: amountInCents,
      currency: plan.currency || 'USD',
      special_reference: merchantReference,
      items: [
        {
          name: `NovaQA ${plan.name} (${interval})`,
          amount: amountInCents,
          quantity: 1,
          description: `Continuous Autonomous Quality Assurance - ${plan.name}`
        }
      ],
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        country: 'EG',
        city: 'Cairo'
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone
      },
      notification_url: `${process.env.APP_BASE_URL || 'http://localhost:4000'}/api/v1/payments/paymob/webhook`,
      redirection_url: params.returnUrl || `${process.env.WEB_BASE_URL || 'http://localhost:3000'}/settings/billing?status=success&payment_ref=${merchantReference}`
    });

    const unifiedCheckoutUrl = this.client.buildUnifiedCheckoutUrl(intention.client_secret);

    // Update payment record with Paymob intention reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymobIntentionId: String(intention.id),
        clientSecret: intention.client_secret,
        checkoutUrl: unifiedCheckoutUrl
      }
    });

    log.info(
      { paymentId: payment.id, merchantReference, planSlug: params.planSlug },
      'Paymob Payment Intention created successfully'
    );

    // Return credentials explicitly safe for frontend consumption
    return {
      paymentId: payment.id,
      merchantReference,
      clientSecret: intention.client_secret,
      unifiedCheckoutUrl,
      publicKey: this.client.getPublicKey(),
      amount: amountInCents,
      currency: plan.currency || 'USD',
      planSlug: params.planSlug,
      interval
    };
  }

  /**
   * 2. Processes incoming Paymob webhook event with strict HMAC verification and idempotency.
   */
  async processWebhook(payload: PaymobWebhookPayload, receivedHmac?: string): Promise<{
    success: boolean;
    idempotent?: boolean;
    status: string;
    paymentId?: string;
    subscriptionActivated: boolean;
    errorReason?: string;
  }> {
    const obj = payload.obj;
    if (!obj) {
      return { success: false, status: 'INVALID_PAYLOAD', subscriptionActivated: false, errorReason: 'Missing obj in webhook payload' };
    }

    const hmacToVerify = receivedHmac || payload.hmac;

    // 1. HMAC Verification
    const verification = this.verifier.verify(obj, hmacToVerify);
    if (!verification.isValid) {
      log.error({ verification }, 'Paymob webhook HMAC verification failed');
      return {
        success: false,
        status: 'UNAUTHORIZED',
        subscriptionActivated: false,
        errorReason: verification.errorReason
      };
    }

    // 2. Identify Payment via merchant reference or transaction ID
    const merchantRef = obj.special_reference || obj.order?.merchant_order_id;
    let payment = null;

    if (merchantRef) {
      payment = await prisma.payment.findUnique({
        where: { merchantReference: merchantRef },
        include: { organization: true }
      });
    }

    if (!payment && obj.id) {
      payment = await prisma.payment.findFirst({
        where: { paymobTransactionId: String(obj.id) },
        include: { organization: true }
      });
    }

    if (!payment) {
      log.warn({ merchantRef, transactionId: obj.id }, 'Received webhook for unrecognized payment reference');
      return {
        success: false,
        status: 'PAYMENT_NOT_FOUND',
        subscriptionActivated: false,
        errorReason: `Payment with reference '${merchantRef || obj.id}' not found.`
      };
    }

    // 3. Idempotency Check: Prevent duplicate webhook processing
    if (payment.status === 'SUCCEEDED' && obj.success) {
      log.info({ paymentId: payment.id }, 'Payment is already SUCCEEDED. Returning idempotent response.');
      return {
        success: true,
        idempotent: true,
        status: 'SUCCEEDED',
        paymentId: payment.id,
        subscriptionActivated: false
      };
    }

    // 4. Validate Amount & Currency against recorded order
    if (obj.amount_cents !== payment.amount || obj.currency.toUpperCase() !== payment.currency.toUpperCase()) {
      const errorMsg = `Amount or currency mismatch: Expected ${payment.amount} ${payment.currency}, received ${obj.amount_cents} ${obj.currency}`;
      log.error({ paymentId: payment.id, errorMsg }, 'Payment validation failed');

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
          rawWebhookPayload: JSON.stringify(payload),
          verificationResult: JSON.stringify(verification)
        }
      });

      return {
        success: false,
        status: 'AMOUNT_MISMATCH',
        paymentId: payment.id,
        subscriptionActivated: false,
        errorReason: errorMsg
      };
    }

    // 5. Evaluate Payment Status
    let nextStatus = 'PENDING';
    let subscriptionActivated = false;

    if (obj.is_refunded) {
      nextStatus = 'REFUNDED';
    } else if (obj.is_voided) {
      nextStatus = 'VOIDED';
    } else if (obj.success && !obj.pending) {
      nextStatus = 'SUCCEEDED';
    } else if (obj.error_occured || (!obj.success && !obj.pending)) {
      nextStatus = 'FAILED';
    }

    // 6. On Successful Payment: Activate Subscription & Issue Invoice
    if (nextStatus === 'SUCCEEDED') {
      const targetPlanSlug = (payment.targetPlanSlug || PlanSlug.STARTER) as PlanSlug;
      const targetInterval = (payment.targetInterval || 'monthly') as BillingInterval;

      // Update organization subscription
      await billingService.changeSubscription(
        payment.organizationId,
        targetPlanSlug,
        targetInterval
      );

      subscriptionActivated = true;

      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          paymobTransactionId: String(obj.id),
          rawWebhookPayload: JSON.stringify(payload),
          verificationResult: JSON.stringify(verification),
          reconciledAt: new Date()
        }
      });

      log.info(
        { paymentId: payment.id, orgId: payment.organizationId, targetPlanSlug },
        '✅ Paymob Payment verified and Subscription successfully activated'
      );
    } else {
      // Update non-succeeded state
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          paymobTransactionId: String(obj.id),
          errorMessage: obj.data?.message || 'Transaction was not successful',
          rawWebhookPayload: JSON.stringify(payload),
          verificationResult: JSON.stringify(verification)
        }
      });

      log.warn(
        { paymentId: payment.id, nextStatus, transactionId: obj.id },
        'Paymob Payment ended in non-success state'
      );
    }

    return {
      success: nextStatus === 'SUCCEEDED',
      status: nextStatus,
      paymentId: payment.id,
      subscriptionActivated
    };
  }

  /**
   * 3. Reconciles a pending or interrupted transaction against the Paymob API.
   */
  async reconcilePayment(paymentId: string): Promise<ReconciliationResult> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { organization: true }
    });

    if (!payment) {
      throw new Error(`Payment '${paymentId}' not found.`);
    }

    const previousStatus = payment.status;

    if (payment.status === 'SUCCEEDED') {
      return {
        paymentId: payment.id,
        merchantReference: payment.merchantReference || '',
        paymobTransactionId: payment.paymobTransactionId || undefined,
        previousStatus,
        currentStatus: 'SUCCEEDED',
        isReconciled: true,
        subscriptionActivated: false,
        message: 'Payment is already settled and active.'
      };
    }

    // Lookup transaction on Paymob
    const transactionId = payment.paymobTransactionId || payment.merchantReference;
    if (!transactionId) {
      return {
        paymentId: payment.id,
        merchantReference: '',
        previousStatus,
        currentStatus: payment.status,
        isReconciled: false,
        subscriptionActivated: false,
        message: 'No Paymob transaction reference available to reconcile.'
      };
    }

    const tx = await this.client.getTransaction(transactionId);
    let currentStatus = payment.status;
    let subscriptionActivated = false;

    if (tx.success && !tx.pending) {
      currentStatus = 'SUCCEEDED';
      await billingService.changeSubscription(
        payment.organizationId,
        (payment.targetPlanSlug || PlanSlug.PRO) as PlanSlug,
        (payment.targetInterval || 'monthly') as BillingInterval
      );
      subscriptionActivated = true;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          paymobTransactionId: String(tx.id),
          reconciledAt: new Date()
        }
      });
    } else if (tx.is_refunded) {
      currentStatus = 'REFUNDED';
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } });
    }

    return {
      paymentId: payment.id,
      merchantReference: payment.merchantReference || '',
      paymobTransactionId: String(tx.id),
      previousStatus,
      currentStatus,
      isReconciled: true,
      subscriptionActivated,
      message: `Transaction reconciled. Current status: ${currentStatus}`
    };
  }

  /**
   * 4. Refunds a transaction on Paymob.
   */
  async refundPayment(paymentId: string, amountCents?: number, reason?: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error(`Payment '${paymentId}' not found.`);

    if (payment.status !== 'SUCCEEDED') {
      throw new Error(`Cannot refund payment in status '${payment.status}'.`);
    }

    const refundAmount = amountCents || payment.amount;
    const txId = payment.paymobTransactionId || payment.merchantReference || payment.id;

    const refundRes = await this.client.refundTransaction(txId, refundAmount);

    const refund = await prisma.refund.create({
      data: {
        organizationId: payment.organizationId,
        paymentId: payment.id,
        amount: refundAmount,
        currency: payment.currency,
        reason: reason || 'Customer requested refund',
        status: refundRes.success ? 'SUCCEEDED' : 'FAILED'
      }
    });

    if (refundRes.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' }
      });
    }

    return refund;
  }
}

export const paymobService = new PaymobService();
