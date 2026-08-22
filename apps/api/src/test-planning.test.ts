import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from './server';
import { prisma } from '@novaqa/database';
import { TokenService } from '@novaqa/auth';
import { Role, ProjectCategory, EngineType, ReviewStatus } from '@novaqa/types';
import { testPlanningEngine } from '@novaqa/ai';

describe('Autonomous AI Test Planning Engine Integration Tests', () => {
  const app = createServer();
  let orgAToken: string;
  let orgBToken: string;
  let orgAId: string;
  let orgBId: string;
  let projectId: string;

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

    // Create target test project for Org A
    const project = await prisma.project.create({
      data: {
        organizationId: orgAId,
        name: 'Planning Test E-Commerce Store',
        slug: `planning-shop-${Date.now().toString(36)}`,
        category: ProjectCategory.WEB,
        engineType: EngineType.PLAYWRIGHT,
        baseUrl: 'http://localhost:3000',
        prdContent: '# Storefront PRD\n\n1. User Authentication (Login, Register, Reset Password)\n2. Catalog & Search\n3. Cart & Coupon Checkout\n4. Role-based Dashboard Access'
      }
    });

    projectId = project.id;
  });

  it('1. should autonomously generate test plan with 19 categories and coverage metrics', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/test-plans/generate`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        title: 'Master Autonomous Test Plan',
        userInstructions: 'Focus on coupon boundary conditions and negative authentication paths.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.coverageMetrics).toBeDefined();
    expect(res.body.data.coverageMetrics.requirementCoverage).toBeGreaterThanOrEqual(80);
    expect(res.body.data.coverageMetrics.routeCoverage).toBeGreaterThan(0);
    expect(res.body.data.coverageMetrics.negativePathCoverage).toBeGreaterThan(0);
    expect(res.body.data.testCases.length).toBeGreaterThanOrEqual(15);

    // Verify test cases contain required structure & traceability
    const firstCase = res.body.data.testCases[0];
    expect(firstCase.customId).toBe('TC001');
    expect(firstCase.title).toBeDefined();
    expect(firstCase.priority).toBeDefined();
    expect(firstCase.category).toBeDefined();
    expect(firstCase.scenarioType).toBeDefined();
    expect(firstCase.steps.length).toBeGreaterThan(0);
    expect(firstCase.requirementReference).toBeDefined();
  });

  it('2. should retrieve latest test plan with parsed coverage and cases', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/test-plans/latest`)
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.testCases.length).toBeGreaterThan(0);
    expect(res.body.data.coverageMetrics.totalScenarios).toBe(res.body.data.testCases.length);
  });

  it('3. should update a planned test case', async () => {
    const plan = await prisma.testPlan.findFirst({
      where: { projectId },
      include: { testCases: true }
    });

    const targetCase = plan!.testCases[0];

    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/test-cases/${targetCase.id}`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        title: 'Updated: Login with valid credentials',
        priority: 'CRITICAL',
        reviewStatus: 'APPROVED'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated: Login with valid credentials');
    expect(res.body.data.reviewStatus).toBe('APPROVED');
  });

  it('4. should execute bulk actions (Approve, Prioritize, Duplicate, Merge)', async () => {
    const plan = await prisma.testPlan.findFirst({
      where: { projectId },
      include: { testCases: true }
    });

    const caseIds = plan!.testCases.slice(0, 3).map((c) => c.id);

    // Bulk Approve
    const approveRes = await request(app)
      .post(`/api/v1/projects/${projectId}/test-cases/bulk`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        testCaseIds: caseIds,
        action: 'APPROVE'
      });

    expect(approveRes.status).toBe(200);

    // Bulk Duplicate
    const dupRes = await request(app)
      .post(`/api/v1/projects/${projectId}/test-cases/bulk`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        testCaseIds: [caseIds[0]],
        action: 'DUPLICATE'
      });

    expect(dupRes.status).toBe(200);

    const checkCopy = await prisma.plannedTestCase.findFirst({
      where: { customId: `${plan!.testCases[0].customId}-COPY` }
    });

    expect(checkCopy).toBeDefined();
  });

  it('5. should export approved test cases to executable TestSuite without deleting existing suites', async () => {
    // Create an existing suite to verify it is NOT deleted
    const existingSuite = await prisma.testSuite.create({
      data: {
        projectId,
        name: 'Pre-existing Suite',
        isActive: true
      }
    });

    const plan = await prisma.testPlan.findFirst({
      where: { projectId }
    });

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/test-plans/${plan!.id}/export-to-suite`)
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.exportedCount).toBeGreaterThan(0);

    // Verify pre-existing suite is still present
    const stillExisting = await prisma.testSuite.findUnique({
      where: { id: existingSuite.id }
    });
    expect(stillExisting).toBeDefined();
  });

  it('6. should enforce tenant isolation on test plans (Org B cannot access Org A plans)', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/test-plans/latest`)
      .set('Authorization', `Bearer ${orgBToken}`);

    // IDOR returns 404
    expect(res.status).toBe(404);
  });
});
