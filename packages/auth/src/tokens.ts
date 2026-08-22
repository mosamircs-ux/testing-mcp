import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { loadConfig } from '@novaqa/shared';
import { Role } from '@novaqa/types';

const config = loadConfig();

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

export class TokenService {
  static signToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN as any
    });
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  }

  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
