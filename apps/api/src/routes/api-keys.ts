import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { ApiKeyService } from '@novaqa/auth';
import { z } from 'zod';

export const apiKeysRouter = Router();

const CreateApiKeySchema = z.object({
  name: z.string().min(2).max(100)
});

// List API Keys
apiKeysRouter.get('/api/v1/api-keys', async (req, res, next) => {
  try {
    const orgId = req.auth?.organizationId;
    const keys = await prisma.apiKey.findMany({
      where: orgId ? { organizationId: orgId } : undefined,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
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

// Create new API Key (Returns raw secret only once)
apiKeysRouter.post('/api/v1/api-keys', async (req, res, next) => {
  try {
    const payload = CreateApiKeySchema.parse(req.body);
    const orgId = req.auth?.organizationId;
    const userId = req.auth?.userId;

    if (!orgId || !userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { rawKey, keyPrefix, hashedKey } = ApiKeyService.generateApiKey();

    const record = await prisma.apiKey.create({
      data: {
        organizationId: orgId,
        userId: userId,
        name: payload.name,
        keyPrefix,
        hashedKey
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        id: record.id,
        name: record.name,
        keyPrefix: record.keyPrefix,
        rawApiKey: rawKey,
        createdAt: record.createdAt
      }
    });
  } catch (err) {
    return next(err);
  }
});

// Revoke API Key
apiKeysRouter.delete('/api/v1/api-keys/:id', async (req, res, next) => {
  try {
    await prisma.apiKey.delete({
      where: { id: req.params.id }
    });

    return res.json({ success: true, message: 'API key revoked successfully' });
  } catch (err) {
    return next(err);
  }
});
