import { Request, Response, NextFunction } from 'express';
import { prisma } from '@novaqa/database';
import { TokenService, ApiKeyService } from '@novaqa/auth';
import { Role } from '@novaqa/types';
import { UnauthorizedError, ForbiddenError } from '@novaqa/shared';

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: Role;
  authMethod: 'JWT' | 'API_KEY';
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check x-api-key header (used by MCP and CI/CD)
    const rawApiKey = req.headers['x-api-key'] as string;
    if (rawApiKey) {
      const hashed = ApiKeyService.hashApiKey(rawApiKey);
      const keyRecord = await prisma.apiKey.findUnique({
        where: { hashedKey: hashed },
        include: {
          organization: true,
          user: { include: { memberships: true } }
        }
      });

      if (!keyRecord) {
        throw new UnauthorizedError('Invalid API Key provided');
      }

      // Update lastUsedAt timestamp asynchronously
      prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() }
      }).catch(() => {});

      const membership = keyRecord.user.memberships.find(m => m.organizationId === keyRecord.organizationId);

      req.auth = {
        userId: keyRecord.userId,
        organizationId: keyRecord.organizationId,
        role: (membership?.role as Role) || Role.ENGINEER,
        authMethod: 'API_KEY'
      };
      return next();
    }

    // 2. Check Authorization Bearer token (used by Web UI)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = TokenService.verifyToken(token);
        req.auth = {
          userId: payload.userId,
          organizationId: payload.organizationId,
          role: payload.role,
          authMethod: 'JWT'
        };
        return next();
      } catch {
        throw new UnauthorizedError('Invalid or expired authentication token');
      }
    }

    // If no credentials provided, attach default demo dev context in development mode
    if (process.env.NODE_ENV === 'development') {
      const firstOrg = await prisma.organization.findFirst({
        include: { members: true }
      });
      if (firstOrg && firstOrg.members[0]) {
        req.auth = {
          userId: firstOrg.members[0].userId,
          organizationId: firstOrg.id,
          role: firstOrg.members[0].role as Role,
          authMethod: 'JWT'
        };
        return next();
      }
    }

    throw new UnauthorizedError('Authentication credentials required');
  } catch (err) {
    next(err);
  }
}
