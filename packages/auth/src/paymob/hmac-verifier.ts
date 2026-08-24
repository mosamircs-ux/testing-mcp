import * as crypto from 'crypto';
import { PaymobTransactionObj, WebhookVerificationResult } from './types.js';

export class PaymobHmacVerifier {
  private hmacSecret: string;

  constructor(hmacSecret?: string) {
    this.hmacSecret = hmacSecret || process.env.PAYMOB_HMAC_SECRET || 'dev_paymob_hmac_secret_key_123';
  }

  /**
   * Generates the HMAC SHA-512 signature for a Paymob transaction object.
   */
  generateHmac(obj: PaymobTransactionObj): string {
    // Standard Paymob transaction HMAC concatenation sequence:
    // amount_cents, created_at, currency, error_occured, has_parent_transaction, id,
    // integration_id, is_3d_secure, is_auth, is_capture, is_refunded, is_standalone_payment,
    // is_voided, order.id, owner, pending, source_data.pan, source_data.sub_type, source_data.type, success
    const concatenated = [
      String(obj.amount_cents ?? ''),
      String(obj.created_at ?? ''),
      String(obj.currency ?? ''),
      String(obj.error_occured ?? false),
      String(obj.has_parent_transaction ?? false),
      String(obj.id ?? ''),
      String(obj.integration_id ?? ''),
      String(obj.is_3d_secure ?? false),
      String(obj.is_auth ?? false),
      String(obj.is_capture ?? false),
      String(obj.is_refunded ?? false),
      String(obj.is_standalone_payment ?? false),
      String(obj.is_voided ?? false),
      String(obj.order?.id ?? ''),
      String(obj.owner ?? ''),
      String(obj.pending ?? false),
      String(obj.source_data?.pan ?? ''),
      String(obj.source_data?.sub_type ?? ''),
      String(obj.source_data?.type ?? ''),
      String(obj.success ?? false)
    ].join('');

    return crypto.createHmac('sha512', this.hmacSecret).update(concatenated).digest('hex');
  }

  /**
   * Verifies an incoming webhook payload using timing-safe comparison.
   */
  verify(obj: PaymobTransactionObj, receivedHmac?: string): WebhookVerificationResult {
    if (!receivedHmac) {
      return {
        isValid: false,
        calculatedHmac: '',
        errorReason: 'Missing HMAC signature in webhook callback.'
      };
    }

    const calculatedHmac = this.generateHmac(obj);

    try {
      const calculatedBuffer = Buffer.from(calculatedHmac, 'hex');
      const receivedBuffer = Buffer.from(receivedHmac, 'hex');

      if (calculatedBuffer.length !== receivedBuffer.length) {
        return {
          isValid: false,
          calculatedHmac,
          receivedHmac,
          errorReason: 'HMAC signature length mismatch.'
        };
      }

      const isValid = crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);

      return {
        isValid,
        calculatedHmac,
        receivedHmac,
        errorReason: isValid ? undefined : 'HMAC signature verification failed (data may have been tampered).'
      };
    } catch (err: any) {
      return {
        isValid: false,
        calculatedHmac,
        receivedHmac,
        errorReason: `HMAC verification error: ${err.message}`
      };
    }
  }
}
