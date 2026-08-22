import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from './server';
import { prisma } from '@novaqa/database';
import { TokenService } from '@novaqa/auth';
import { Role, ProjectCategory, EngineType } from '@novaqa/types';
import { discoveryEngine } from '@novaqa/ai';

describe('Project Onboarding & Autonomous AI Discovery Engine Tests', () => {
  const app = createServer();
  let orgAToken: string;
  let orgBToken: string;
  let orgAId: string;
  let orgBId: string;

  beforeAll(async () => {
    // Setup Tenant A (Acme Corp)
    let orgA = await prisma.organization.findUnique({ where: { slug: 'acme-corp' } });
    if (!orgA) {
      orgA = await prisma.organization.create({
        data: { name: 'Acme Corp', slug: 'acme-corp', tier: 'ENTERPRISE' }
      });
    }
    orgAId = orgA.id;

    let userA = await prisma.user.findUnique({ where: { email: 'alice@acme.com' } });
    if (!userA) {
      userA = await prisma.user.create({
        data: {
          name: 'Alice (Owner)',
          email: 'alice@acme.com',
          passwordHash: await TokenService.hashPassword('Password123!'),
          isEmailVerified: true
        }
      });
      await prisma.organizationMember.create({
        data: { organizationId: orgAId, userId: userA.id, role: 'OWNER' }
      });
    }

    orgAToken = TokenService.signAccessToken({
      userId: userA.id,
      email: userA.email,
      organizationId: orgAId,
      role: Role.OWNER
    });

    // Setup Tenant B (Globex Industries)
    let orgB = await prisma.organization.findUnique({ where: { slug: 'globex-industries' } });
    if (!orgB) {
      orgB = await prisma.organization.create({
        data: { name: 'Globex Industries', slug: 'globex-industries', tier: 'PRO' }
      });
    }
    orgBId = orgB.id;

    let userB = await prisma.user.findUnique({ where: { email: 'eve@globex.com' } });
    if (!userB) {
      userB = await prisma.user.create({
        data: {
          name: 'Eve (Globex Owner)',
          email: 'eve@globex.com',
          passwordHash: await TokenService.hashPassword('Password123!'),
          isEmailVerified: true
        }
      });
      await prisma.organizationMember.create({
        data: { organizationId: orgBId, userId: userB.id, role: 'OWNER' }
      });
    }

    orgBToken = TokenService.signAccessToken({
      userId: userB.id,
      email: userB.email,
      organizationId: orgBId,
      role: Role.OWNER
    });
  });

  it('1. should execute 9-step project onboarding via API', async () => {
    const onboardingPayload = {
      // Step 1: Project Name
      name: 'Onboarding Test Shop',
      description: 'E-Commerce fullstack application for integration verification',
      // Step 2: Project Type
      category: ProjectCategory.WEB,
      // Step 3: Environment
      environment: 'STAGING',
      // Step 4: App URL
      appUrl: 'http://localhost:3000',
      // Step 5: API Base URL
      apiBaseUrl: 'http://localhost:4000',
      // Step 6: Auth Config
      authConfig: {
        type: 'BEARER',
        token: 'test-secret-token'
      },
      // Step 7: PRD
      prdContent: '# PRD: Checkout & Catalog Flow',
      // Step 8: Repo
      repoConfig: {
        repositoryUrl: 'https://github.com/acme/shop.git',
        branch: 'main'
      },
      // Step 9: Testing Preferences
      testingPreferences: {
        engineType: EngineType.PLAYWRIGHT,
        autoHeal: true,
        captureVideo: true,
        timeoutMs: 30000
      },
      triggerDiscovery: true
    };

    const res = await request(app)
      .post('/api/v1/projects/onboarding')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send(onboardingPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projectId).toBeDefined();
    expect(res.body.data.discoveryInitiated).toBe(true);

    const projectId = res.body.data.projectId;

    // Verify Project & Default Environment exist in database
    const dbProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { environments: true }
    });

    expect(dbProject).toBeDefined();
    expect(dbProject?.organizationId).toBe(orgAId);
    expect(dbProject?.environments.length).toBe(1);
    expect(dbProject?.environments[0].slug).toBe('staging');
  });

  it('2. DiscoveryEngine should run all 7 phases and persist complete normalized spec', async () => {
    // Create a standalone project for testing discovery engine
    const project = await prisma.project.create({
      data: {
        organizationId: orgAId,
        name: 'Autonomous Discovery Engine Project',
        slug: `disc-engine-proj-${Date.now().toString(36)}`,
        category: ProjectCategory.WEB,
        engineType: EngineType.PLAYWRIGHT,
        baseUrl: 'http://localhost:3000'
      }
    });

    const progressEvents: any[] = [];

    const discoveryResult = await discoveryEngine.runDiscovery({
      projectId: project.id,
      projectName: project.name,
      category: project.category,
      appUrl: 'http://localhost:3000',
      apiBaseUrl: 'http://localhost:4000',
      onProgress: (evt) => progressEvents.push(evt)
    });

    expect(discoveryResult.status).toBe('COMPLETED');
    expect(discoveryResult.progress).toBe(100);
    expect(discoveryResult.techStack.framework).toContain('Next.js');
    expect(discoveryResult.routesMap.length).toBeGreaterThan(0);
    expect(discoveryResult.apiMap.length).toBeGreaterThan(0);
    expect(discoveryResult.featureMap.length).toBeGreaterThan(0);
    expect(discoveryResult.workflowMap.length).toBeGreaterThan(0);
    expect(discoveryResult.riskAreas.length).toBeGreaterThan(0);
    expect(discoveryResult.normalizedSpec.projectName).toBe(project.name);

    // Verify progress events progressed from low to 100%
    expect(progressEvents.length).toBeGreaterThanOrEqual(4);
    expect(progressEvents[progressEvents.length - 1].progress).toBe(100);

    // Verify initial test suites were created automatically in database
    const createdSuites = await prisma.testSuite.findMany({
      where: { projectId: project.id },
      include: { testCases: { include: { steps: true } } }
    });

    expect(createdSuites.length).toBeGreaterThan(0);
    expect(createdSuites[0].testCases.length).toBeGreaterThan(0);
    expect(createdSuites[0].testCases[0].steps.length).toBeGreaterThan(0);
  });

  it('3. should retrieve latest discovery and discovery history via API', async () => {
    const project = await prisma.project.create({
      data: {
        organizationId: orgAId,
        name: 'API Discovery Retrieval Test',
        slug: `api-disc-test-${Date.now().toString(36)}`,
        category: ProjectCategory.REST_API,
        engineType: EngineType.API_REST,
        baseUrl: 'http://localhost:4000'
      }
    });

    // Run discovery
    await discoveryEngine.runDiscovery({
      projectId: project.id,
      projectName: project.name,
      category: project.category
    });

    // Query latest discovery endpoint
    const latestRes = await request(app)
      .get(`/api/v1/projects/${project.id}/discovery/latest`)
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(latestRes.status).toBe(200);
    expect(latestRes.body.success).toBe(true);
    expect(latestRes.body.data.status).toBe('COMPLETED');
    expect(latestRes.body.data.applicationMap).toBeDefined();
    expect(latestRes.body.data.routesMap).toBeDefined();
    expect(latestRes.body.data.apiMap).toBeDefined();

    // Query discovery history endpoint
    const historyRes = await request(app)
      .get(`/api/v1/projects/${project.id}/discovery/history`)
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBeGreaterThan(0);
  });

  it('4. should enforce tenant isolation on project discoveries (Org B cannot read Org A discovery)', async () => {
    const projectA = await prisma.project.create({
      data: {
        organizationId: orgAId,
        name: 'Org A Secret Project',
        slug: `org-a-secret-${Date.now().toString(36)}`,
        category: ProjectCategory.WEB,
        baseUrl: 'http://localhost:3000'
      }
    });

    await discoveryEngine.runDiscovery({
      projectId: projectA.id,
      projectName: projectA.name,
      category: projectA.category
    });

    // Org B user attempts to access Org A discovery
    const crossTenantRes = await request(app)
      .get(`/api/v1/projects/${projectA.id}/discovery/latest`)
      .set('Authorization', `Bearer ${orgBToken}`);

    // IDOR protection returns 404
    expect(crossTenantRes.status).toBe(404);
  });
});
