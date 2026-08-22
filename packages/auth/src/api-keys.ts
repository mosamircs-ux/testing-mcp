import crypto from 'crypto';
import { loadConfig } from '@novaqa/shared';

const config = loadConfig();

export interface GeneratedApiKey {
  rawKey: string;
  keyPrefix: string;
  hashedKey: string;
}

export class ApiKeyService {
  /**
   * Generates a new cryptographically secure API key
   * Format: nqa_live_<32_random_bytes_hex>
   */
  static generateApiKey(prefix = 'nqa_live_'): GeneratedApiKey {
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const rawKey = `${prefix}${randomBytes}`;
    const keyPrefix = rawKey.substring(0, 12);
    const hashedKey = this.hashApiKey(rawKey);

    return {
      rawKey,
      keyPrefix,
      hashedKey
    };
  }

  /**
   * Hashes raw API key with system salt using HMAC-SHA256
   */
  static hashApiKey(rawKey: string): string {
    return crypto
      .createHmac('sha256', config.API_KEY_SALT)
      .update(rawKey)
      .digest('hex');
  }

  /**
   * Verifies if a given raw API key matches the stored hash
   */
  static verifyApiKey(rawKey: string, storedHash: string): boolean {
    const computedHash = this.hashApiKey(rawKey);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  }
}
