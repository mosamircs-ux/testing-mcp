import { createChildLogger } from '@novaqa/shared';
import {
  PaymobConfig,
  PaymobIntentionRequest,
  PaymobIntentionResponse,
  PaymobTransactionObj
} from './types.js';

const log = createChildLogger('paymob-client');

export class PaymobClient {
  private secretKey: string;
  private publicKey: string;
  private baseUrl: string;
  private isSandbox: boolean;

  constructor(config?: Partial<PaymobConfig>) {
    this.secretKey = config?.secretKey || process.env.PAYMOB_SECRET_KEY || 'test_sec_k_dev1234567890abcdef';
    this.publicKey = config?.publicKey || process.env.PAYMOB_PUBLIC_KEY || 'test_pub_k_dev1234567890abcdef';
    this.baseUrl = (config?.baseUrl || process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com').replace(/\/$/, '');
    this.isSandbox = config?.isSandbox ?? (process.env.PAYMOB_SANDBOX !== 'false');
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Creates a payment intention via Paymob Intention API (v1/intention/).
   */
  async createIntention(request: PaymobIntentionRequest): Promise<PaymobIntentionResponse> {
    log.info(
      { amount: request.amount, currency: request.currency, ref: request.special_reference },
      'Creating Paymob Payment Intention'
    );

    // If in test environment / sandbox mock mode without live network
    if (process.env.NODE_ENV === 'test' || this.secretKey.startsWith('test_')) {
      const mockIntentionId = `intent_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const mockClientSecret = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      return {
        id: mockIntentionId,
        client_secret: mockClientSecret,
        amount: request.amount,
        currency: request.currency,
        special_reference: request.special_reference,
        payment_keys: [{ key: mockClientSecret, gateway_type: 'unified_checkout' }]
      };
    }

    try {
      const url = `${this.baseUrl}/v1/intention/`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        const errorBody = await res.text();
        log.error({ status: res.status, body: errorBody }, 'Paymob Intention API request failed');
        throw new Error(`Paymob Intention API error (${res.status}): ${errorBody}`);
      }

      const data = (await res.json()) as PaymobIntentionResponse;
      return data;
    } catch (err: any) {
      log.error({ err: err.message }, 'Failed to communicate with Paymob Intention API');
      throw err;
    }
  }

  /**
   * Retrieves transaction status by Paymob transaction ID for reconciliation.
   */
  async getTransaction(transactionId: number | string): Promise<PaymobTransactionObj> {
    log.info({ transactionId }, 'Fetching Paymob Transaction for Reconciliation');

    if (process.env.NODE_ENV === 'test' || this.secretKey.startsWith('test_')) {
      return {
        id: transactionId,
        amount_cents: 7900,
        currency: 'USD',
        success: true,
        pending: false,
        is_refunded: false,
        is_voided: false,
        created_at: new Date().toISOString()
      };
    }

    try {
      const url = `${this.baseUrl}/api/acceptance/transactions/${transactionId}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Paymob getTransaction error (${res.status}): ${errorBody}`);
      }

      return (await res.json()) as PaymobTransactionObj;
    } catch (err: any) {
      log.error({ transactionId, err: err.message }, 'Failed to fetch transaction from Paymob');
      throw err;
    }
  }

  /**
   * Issues refund on Paymob transaction.
   */
  async refundTransaction(transactionId: number | string, amountCents: number): Promise<{ success: boolean; transaction_id: string | number }> {
    log.info({ transactionId, amountCents }, 'Refunding Paymob Transaction');

    if (process.env.NODE_ENV === 'test' || this.secretKey.startsWith('test_')) {
      return {
        success: true,
        transaction_id: `ref_${Date.now()}`
      };
    }

    try {
      const url = `${this.baseUrl}/api/acceptance/void_refund/refund`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_token: this.secretKey,
          transaction_id: transactionId,
          amount_cents: amountCents
        })
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Paymob refund error (${res.status}): ${errorBody}`);
      }

      return await res.json();
    } catch (err: any) {
      log.error({ transactionId, err: err.message }, 'Failed to refund transaction on Paymob');
      throw err;
    }
  }

  /**
   * Generates the Unified Checkout redirection URL.
   */
  buildUnifiedCheckoutUrl(clientSecret: string): string {
    return `${this.baseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(this.publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`;
  }
}
