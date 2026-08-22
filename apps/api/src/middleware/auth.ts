import { Request, Response, NextFunction } from 'express';
import { prisma } from '@novaqa/database';
import { TokenService, ApiKeyService, can } from '@novaqa/auth';
import { Role, Permission } from '@novaqa/types';
import { UnauthorizedError, ForbiddenError } from '@novaqa/shared';

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: Role;
  authMethod: 'JWT' | 'API_KEY';
  apiKeyId?: string;
  projectId?: string | null;
  sessionId?: string;
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
    // 1. Check x-api-key header (used by MCP, CI/CD, and external runners)
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

      if (keyRecord.revokedAt) {
        throw new UnauthorizedError('API Key has been revoked');
      }

      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        throw new UnauthorizedError('API Key has expired');
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
        role: (membership?.role as Role) || Role.QA_ENGINEER,
        authMethod: 'API_KEY',
        apiKeyId: keyRecord.id,
        projectId: keyRecord.projectId
      };
      return next();
    }

    // 2. Check Authorization Bearer token (used by Web UI and API clients)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = TokenService.verifyAccessToken(token);

        // Optional tenant context switch via X-Organization-Id header
        const requestedOrgId = req.headers['x-organization-id'] as string;
        let activeOrgId = payload.organizationId;
        let activeRole = payload.role;

        if (requestedOrgId && requestedOrgId !== activeOrgId) {
          const membership = await prisma.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId: requestedOrgId,
                userId: payload.userId
              }
            }
          });
          if (membership) {
            activeOrgId = membership.organizationId;
            activeRole = membership.role as Role;
          }
        }

        req.auth = {
          userId: payload.userId,
          organizationId: activeOrgId,
          role: activeRole,
          authMethod: 'JWT',
          sessionId: payload.sessionId
        };
        return next();
      } catch {
        throw new UnauthorizedError('Invalid or expired authentication token');
      }
    }

    // 3. In test/dev environment with no auth header, provide fallback ONLY if explicitly enabled
    if (process.env.ALLOW_ANONYMOUS_DEV === 'true') {
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

/**
 * Middleware factory requiring specific granular permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!can(req.auth.role, permission)) {
      return next(new ForbiddenError(`Forbidden: Role '${req.auth.role}' lacks '${permission}' permission`));
    }

    next();
  };
}

/**
 * Ensures project-scoped API keys can only access their designated project
 */
export function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.authMethod === 'API_KEY' && req.auth.projectId) {
    const targetProjectId = req.params.projectId || req.params.id || req.body.projectId;
    if (targetProjectId && targetProjectId !== req.auth.projectId) {
      return next(new ForbiddenError('API Key is scoped to a different project'));
    }
  }
  next();
}
