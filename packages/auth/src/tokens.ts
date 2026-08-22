import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { loadConfig } from '@novaqa/shared';
import { Role, AuthTokens } from '@novaqa/types';

const config = loadConfig();

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
  sessionId?: string;
}

export interface RefreshJwtPayload {
  userId: string;
  sessionId: string;
}

export class TokenService {
  /**
   * Signs a short-lived access JWT token
   */
  static signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN as any
    });
  }

  /**
   * Backwards compatible signToken method
   */
  static signToken(payload: JwtPayload): string {
    return this.signAccessToken(payload);
  }

  /**
   * Verifies an access JWT token
   */
  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  }

  static verifyToken(token: string): JwtPayload {
    return this.verifyAccessToken(token);
  }

  /**
   * Generates a cryptographically secure random refresh token string
   */
  static generateRefreshToken(): string {
    return `nqa_rf_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Computes SHA-256 hash of refresh token for database storage
   */
  static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Generates a secure time-limited token for Email Verification or Password Reset
   */
  static generateTimedToken(): { token: string; hashedToken: string; expiresAt: Date } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    return {
      token: rawToken,
      hashedToken,
      expiresAt
    };
  }

  /**
   * Hashes user password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares password with stored bcrypt hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
