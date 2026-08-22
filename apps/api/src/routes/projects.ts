import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { discoveryEngine } from '@novaqa/ai';
import {
  CreateProjectSchema,
  CreateEnvironmentSchema,
  ProjectOnboardingSchema,
  DiscoveryStatus
} from '@novaqa/types';
import { NotFoundError, ForbiddenError, BadRequestError } from '@novaqa/shared';
import { authMiddleware, requirePermission, requireProjectAccess } from '../middleware/auth';
import { z } from 'zod';

export const projectsRouter = Router();

// Apply auth middleware to all project endpoints
projectsRouter.use(authMiddleware);

// ============================================================================
// 1. List all projects in user's active organization (requires project.read)
// ============================================================================
projectsRouter.get('/api/v1/projects', requirePermission('project.read'), async (req, res, next) => {
  try {
    const orgId = req.auth!.organizationId;

    const whereClause: any = { organizationId: orgId };
    if (req.auth?.authMethod === 'API_KEY' && req.auth.projectId) {
      whereClause.id = req.auth.projectId;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        environments: true,
        testSuites: { include: { testCases: true } },
        discoveries: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: { select: { testRuns: true, findings: true, discoveries: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 2. Project Onboarding Wizard Endpoint (9-Step Submission)
// ============================================================================
projectsRouter.post('/api/v1/projects/onboarding', requirePermission('project.create'), async (req, res, next) => {
  try {
    const input = ProjectOnboardingSchema.parse(req.body);
    const orgId = req.auth!.organizationId;

    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const effectiveBaseUrl = input.appUrl || input.apiBaseUrl || 'http://localhost:3000';

    const project = await prisma.project.create({
      data: {
        organizationId: orgId,
        name: input.name,
        slug,
        description: input.description || null,
        category: input.category,
        engineType: input.testingPreferences?.engineType || 'PLAYWRIGHT',
        baseUrl: effectiveBaseUrl,
        appUrl: input.appUrl || null,
        specUrl: input.apiBaseUrl || null,
        authConfig: JSON.stringify(input.authConfig || {}),
        repoConfig: JSON.stringify(input.repoConfig || {}),
        testingPreferences: JSON.stringify(input.testingPreferences || {}),
        prdContent: input.prdContent || null,
        settings: JSON.stringify({
          onboardedAt: new Date().toISOString(),
          environment: input.environment
        }),
        environments: {
          create: {
            name: `${input.environment.charAt(0)}${input.environment.slice(1).toLowerCase()} Environment`,
            slug: input.environment.toLowerCase(),
            baseUrl: effectiveBaseUrl,
            isDefault: true
          }
        }
      },
      include: {
        environments: true
      }
    });

    let discoveryPromise;
    if (input.triggerDiscovery) {
      discoveryPromise = discoveryEngine.runDiscovery({
        projectId: project.id,
        projectName: project.name,
        category: project.category,
        appUrl: input.appUrl,
        apiBaseUrl: input.apiBaseUrl,
        authConfig: input.authConfig,
        repoConfig: input.repoConfig,
        prdContent: input.prdContent,
        testingPreferences: input.testingPreferences
      }).catch((err) => {
        console.error('Background discovery run error:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Project onboarded successfully. Autonomous discovery initiated.',
      data: {
        projectId: project.id,
        projectSlug: project.slug,
        name: project.name,
        category: project.category,
        baseUrl: project.baseUrl,
        discoveryInitiated: Boolean(input.triggerDiscovery)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 3. Trigger Discovery On-Demand for existing project
// ============================================================================
projectsRouter.post('/api/v1/projects/:id/discovery', requirePermission('project.update'), requireProjectAccess, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const orgId = req.auth!.organizationId;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    // Launch discovery in background
    discoveryEngine.runDiscovery({
      projectId: project.id,
      projectName: project.name,
      category: project.category,
      appUrl: project.appUrl || project.baseUrl || undefined,
      apiBaseUrl: project.specUrl || undefined,
      authConfig: project.authConfig ? JSON.parse(project.authConfig) : undefined,
      repoConfig: project.repoConfig ? JSON.parse(project.repoConfig) : undefined,
      prdContent: project.prdContent || undefined,
      testingPreferences: project.testingPreferences ? JSON.parse(project.testingPreferences) : undefined
    }).catch((err) => console.error('Discovery execution error:', err));

    res.status(202).json({
      success: true,
      message: 'Autonomous discovery run initiated successfully.',
      streamUrl: `/api/v1/projects/${project.id}/discovery/stream`
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 4. Get Latest Discovery Maps & Normalized Specification
// ============================================================================
projectsRouter.get('/api/v1/projects/:id/discovery/latest', requirePermission('project.read'), requireProjectAccess, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const orgId = req.auth!.organizationId;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    const latest = await prisma.projectDiscovery.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    if (!latest) {
      return res.json({
        success: true,
        data: null,
        message: 'No discovery runs performed yet.'
      });
    }

    return res.json({
      success: true,
      data: {
        id: latest.id,
        projectId: latest.projectId,
        status: latest.status,
        progress: latest.progress,
        currentStep: latest.currentStep,
        techStack: JSON.parse(latest.techStack || '{}'),
        applicationMap: JSON.parse(latest.applicationMap || '{}'),
        routesMap: JSON.parse(latest.routesMap || '[]'),
        apiMap: JSON.parse(latest.apiMap || '[]'),
        featureMap: JSON.parse(latest.featureMap || '[]'),
        authMap: JSON.parse(latest.authMap || '{}'),
        roleMap: JSON.parse(latest.roleMap || '[]'),
        workflowMap: JSON.parse(latest.workflowMap || '[]'),
        riskAreas: JSON.parse(latest.riskAreas || '[]'),
        normalizedSpec: JSON.parse(latest.normalizedSpec || '{}'),
        logs: JSON.parse(latest.logs || '[]'),
        startedAt: latest.startedAt,
        completedAt: latest.completedAt,
        durationMs: latest.durationMs
      }
    });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 5. Get Discovery Run History
// ============================================================================
projectsRouter.get('/api/v1/projects/:id/discovery/history', requirePermission('project.read'), requireProjectAccess, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const orgId = req.auth!.organizationId;

    const discoveries = await prisma.projectDiscovery.findMany({
      where: {
        projectId: id,
        project: { organizationId: orgId }
      },
      select: {
        id: true,
        status: true,
        progress: true,
        currentStep: true,
        durationMs: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: discoveries });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 6. Live Server-Sent Events (SSE) Stream for Real-Time Discovery Progress
// ============================================================================
projectsRouter.get('/api/v1/projects/:id/discovery/stream', async (req, res, next) => {
  try {
    const projectId = String(req.params.id);

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: req.auth!.organizationId
      }
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', projectId, timestamp: new Date().toISOString() })}\n\n`);

    const interval = setInterval(async () => {
      const latest = await prisma.projectDiscovery.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      });

      if (!latest) {
        res.write(`data: ${JSON.stringify({ type: 'STATUS', status: 'PENDING', progress: 0, currentStep: 'WAITING_FOR_TRIGGER' })}\n\n`);
        return;
      }

      const parsedLogs = JSON.parse(latest.logs || '[]');
      const lastLog = parsedLogs[parsedLogs.length - 1]?.message || '';

      res.write(
        `data: ${JSON.stringify({
          type: 'PROGRESS',
          discoveryId: latest.id,
          status: latest.status,
          progress: latest.progress,
          currentStep: latest.currentStep,
          logMessage: lastLog,
          durationMs: latest.durationMs,
          logs: parsedLogs,
          completedAt: latest.completedAt
        })}\n\n`
      );

      if (latest.status === 'COMPLETED' || latest.status === 'FAILED') {
        res.write(`data: ${JSON.stringify({ type: 'FINISHED', status: latest.status, progress: 100 })}\n\n`);
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 7. Get Project Details by ID (strictly tenant-isolated)
// ============================================================================
projectsRouter.get('/api/v1/projects/:id', requirePermission('project.read'), requireProjectAccess, async (req, res, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const id = String(req.params.id);

    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: orgId
      },
      include: {
        environments: true,
        testSuites: { include: { testCases: { include: { steps: true } } } },
        discoveries: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
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
      throw new NotFoundError('Project', id);
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 8. Create Project
// ============================================================================
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

// 9. Update Project
projectsRouter.patch('/api/v1/projects/:id', requirePermission('project.update'), requireProjectAccess, async (req, res, next) => {
  try {
    const id = String(req.params.id);
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

// 10. Delete Project
projectsRouter.delete('/api/v1/projects/:id', requirePermission('project.delete'), requireProjectAccess, async (req, res, next) => {
  try {
    const id = String(req.params.id);
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

// 11. Create Environment
projectsRouter.post('/api/v1/projects/:id/environments', requirePermission('project.update'), requireProjectAccess, async (req, res, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const projectId = String(req.params.id);

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const payload = CreateEnvironmentSchema.parse({
      ...req.body,
      projectId
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
