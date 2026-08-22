import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { storage, NotFoundError } from '@novaqa/shared';

export const artifactsRouter = Router();

// Download / stream artifact
artifactsRouter.get('/api/v1/artifacts/:id/download', async (req, res, next) => {
  try {
    const artifact = await prisma.artifact.findFirst({
      where: {
        OR: [{ id: req.params.id }, { storageKey: decodeURIComponent(req.params.id) }]
      }
    });

    if (!artifact) throw new NotFoundError('Artifact', req.params.id);

    const fileBuffer = await storage.download(artifact.storageKey);
    res.setHeader('Content-Type', artifact.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${artifact.fileName}"`);
    res.send(fileBuffer);
  } catch (err) {
    next(err);
  }
});
