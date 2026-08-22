import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { ApiKeyService } from '@novaqa/auth';
import { CreateApiKeySchema } from '@novaqa/types';
import { NotFoundError, BadRequestError } from '@novaqa/shared';
import { authMiddleware, requirePermission } from '../middleware/auth';

export const apiKeysRouter = Router();

// Apply auth middleware to all api-keys endpoints
apiKeysRouter.use(authMiddleware);

// 1. List API Keys in active organization (requires api_key.read)
apiKeysRouter.get('/api/v1/api-keys', requirePermission('api_key.read'), async (req, res, next) => {
  try {
    const orgId = req.auth!.organizationId;

    const keys = await prisma.apiKey.findMany({
      where: {
        organizationId: orgId,
        revokedAt: null
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scope: true,
        projectId: true,
        project: { select: { id: true, name: true, slug: true } },
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        mcpSessions: { select: { clientName: true, lastActiveAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: keys });
  } catch (err) {
    return next(err);
  }
});

// 2. Create new API Key (Returns raw secret only once, requires api_key.create)
apiKeysRouter.post('/api/v1/api-keys', requirePermission('api_key.create'), async (req, res, next) => {
  try {
    const payload = CreateApiKeySchema.parse(req.body);
    const orgId = req.auth!.organizationId;
    const userId = req.auth!.userId;

    // If project specified, verify it belongs to this organization
    if (payload.projectId) {
      const proj = await prisma.project.findFirst({
        where: { id: payload.projectId, organizationId: orgId }
      });
      if (!proj) {
        throw new NotFoundError('Project', payload.projectId);
      }
    }

    const { rawKey, keyPrefix, hashedKey } = ApiKeyService.generateApiKey();

    const expiresAt = payload.expiresInDays
      ? new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const record = await prisma.apiKey.create({
      data: {
        organizationId: orgId,
        userId: userId,
        projectId: payload.projectId || null,
        name: payload.name,
        keyPrefix,
        hashedKey,
        scope: payload.scope || 'ALL',
        expiresAt
      },
      include: {
        project: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        id: record.id,
        name: record.name,
        keyPrefix: record.keyPrefix,
        rawApiKey: rawKey,
        projectId: record.projectId,
        projectName: record.project?.name,
        scope: record.scope,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt
      }
    });
  } catch (err) {
    return next(err);
  }
});

// 3. Revoke API Key (requires api_key.delete, tenant-scoped)
apiKeysRouter.delete('/api/v1/api-keys/:id', requirePermission('api_key.delete'), async (req, res, next) => {
  try {
    const key = await prisma.apiKey.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.auth!.organizationId
      }
    });

    if (!key) {
      throw new NotFoundError('ApiKey', req.params.id);
    }

    // Soft revoke and clean sessions
    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { revokedAt: new Date() }
    });

    return res.json({ success: true, message: 'API key revoked successfully' });
  } catch (err) {
    return next(err);
  }
});
