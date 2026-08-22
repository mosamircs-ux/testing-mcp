import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { CreateProjectSchema, CreateEnvironmentSchema } from '@novaqa/types';
import { NotFoundError } from '@novaqa/shared';

export const projectsRouter = Router();

// List all projects in user's organization
projectsRouter.get('/api/v1/projects', async (req, res, next) => {
  try {
    const orgId = req.auth?.organizationId;
    const projects = await prisma.project.findMany({
      where: orgId ? { organizationId: orgId } : undefined,
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

// Get project by ID
projectsRouter.get('/api/v1/projects/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
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

// Create Project
projectsRouter.post('/api/v1/projects', async (req, res, next) => {
  try {
    const payload = CreateProjectSchema.parse({
      ...req.body,
      organizationId: req.auth?.organizationId || req.body.organizationId
    });

    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const project = await prisma.project.create({
      data: {
        organizationId: payload.organizationId,
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

// Create Environment
projectsRouter.post('/api/v1/projects/:id/environments', async (req, res, next) => {
  try {
    const payload = CreateEnvironmentSchema.parse({
      ...req.body,
      projectId: req.params.id
    });

    const env = await prisma.environment.create({
      data: {
        projectId: payload.projectId,
        name: payload.name,
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
