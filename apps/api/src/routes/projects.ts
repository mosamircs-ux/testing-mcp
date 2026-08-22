import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { CreateProjectSchema, CreateEnvironmentSchema } from '@novaqa/types';
import { NotFoundError, ForbiddenError } from '@novaqa/shared';
import { authMiddleware, requirePermission, requireProjectAccess } from '../middleware/auth';
import { z } from 'zod';

export const projectsRouter = Router();

// Apply auth middleware to all project endpoints
projectsRouter.use(authMiddleware);

// 1. List all projects in user's active organization (requires project.read)
projectsRouter.get('/api/v1/projects', requirePermission('project.read'), async (req, res, next) => {
  try {
    const orgId = req.auth!.organizationId;

    // If API Key is scoped to a specific project, restrict list to that project
    const whereClause: any = { organizationId: orgId };
    if (req.auth?.authMethod === 'API_KEY' && req.auth.projectId) {
      whereClause.id = req.auth.projectId;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        environments: true,
        testSuites: { include: { testCases: true } },
        _count: { select: { testRuns: true, findings: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

// 2. Get project by ID (strictly tenant-isolated, prevents IDOR)
projectsRouter.get('/api/v1/projects/:id', requirePermission('project.read'), requireProjectAccess, async (req, res, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        organizationId: orgId
      },
      include: {
        environments: true,
        testSuites: { include: { testCases: { include: { steps: true } } } },
        testRuns: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        findings: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      throw new NotFoundError('Project', req.params.id);
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// 3. Create Project (requires project.create)
projectsRouter.post('/api/v1/projects', requirePermission('project.create'), async (req, res, next) => {
  try {
    const payload = CreateProjectSchema.parse({
      ...req.body,
      organizationId: req.auth!.organizationId
    });

    const slug = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    const project = await prisma.project.create({
      data: {
        organizationId: req.auth!.organizationId,
        teamId: payload.teamId,
        name: payload.name,
        slug,
        description: payload.description,
        category: payload.category,
        engineType: payload.engineType,
        repositoryUrl: payload.repositoryUrl,
        baseUrl: payload.baseUrl,
        specUrl: payload.specUrl,
        settings: JSON.stringify(payload.settings),
        environments: {
          create: {
            name: 'Default Environment',
            slug: 'default',
            baseUrl: payload.baseUrl || 'http://localhost:3000',
            isDefault: true
          }
        }
      },
      include: { environments: true }
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  baseUrl: z.string().url().optional(),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  settings: z.record(z.unknown()).optional()
});

// 4. Update Project (requires project.update)
projectsRouter.patch('/api/v1/projects/:id', requirePermission('project.update'), requireProjectAccess, async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.auth!.organizationId;

    const existing = await prisma.project.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!existing) {
      throw new NotFoundError('Project', id);
    }

    const payload = UpdateProjectSchema.parse(req.body);

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description,
        baseUrl: payload.baseUrl,
        repositoryUrl: payload.repositoryUrl,
        settings: payload.settings ? JSON.stringify(payload.settings) : undefined
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// 5. Delete Project (requires project.delete)
projectsRouter.delete('/api/v1/projects/:id', requirePermission('project.delete'), requireProjectAccess, async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.auth!.organizationId;

    const existing = await prisma.project.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!existing) {
      throw new NotFoundError('Project', id);
    }

    await prisma.project.delete({ where: { id } });

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// 6. Create Environment (requires project.update)
projectsRouter.post('/api/v1/projects/:id/environments', requirePermission('project.update'), requireProjectAccess, async (req, res, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, organizationId: orgId }
    });

    if (!project) {
      throw new NotFoundError('Project', req.params.id);
    }

    const payload = CreateEnvironmentSchema.parse({
      ...req.body,
      projectId: req.params.id
    });

    const env = await prisma.environment.create({
      data: {
        projectId: payload.projectId,
        name: payload.name,
        slug: `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
        baseUrl: payload.baseUrl,
        variables: JSON.stringify(payload.variables),
        headers: JSON.stringify(payload.headers),
        isDefault: payload.isDefault
      }
    });

    res.status(201).json({ success: true, data: env });
  } catch (err) {
    next(err);
  }
});
