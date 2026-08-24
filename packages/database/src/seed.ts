import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { ApiKeyService } from '@novaqa/auth';

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

function hashApiKey(rawKey: string) {
  return ApiKeyService.hashApiKey(rawKey);
}

export async function main() {
  console.log('🌱 Starting NovaQA Multi-Tenant Database Seeding...');

  const existingCount = await prisma.user.count();
  if (existingCount > 0 && process.env.FORCE_SEED !== 'true') {
    console.log(`ℹ️ Database already contains ${existingCount} users. Skipping seeding (set FORCE_SEED=true to override).`);
    return;
  }

  // Clean existing records safely
  await prisma.auditLog.deleteMany();
  await prisma.usageMetric.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.mcpSession.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.session.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.testRun.deleteMany();
  await prisma.testCaseStep.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.testSuite.deleteMany();
  await prisma.environment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const defaultPasswordHash = await hashPassword('Password123!');

  // 1. Create Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@acme.com',
      name: 'Alice (Acme Owner)',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@acme.com',
      name: 'Bob (Acme QA Lead)',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true
    }
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@acme.com',
      name: 'Charlie (Acme Developer)',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true
    }
  });

  const david = await prisma.user.create({
    data: {
      email: 'david@acme.com',
      name: 'David (Acme Viewer)',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true
    }
  });

  const grace = await prisma.user.create({
    data: {
      email: 'grace@acme.com',
      name: 'Grace (Acme Billing)',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true
    }
  });

  const eve = await prisma.user.create({
    data: {
      email: 'eve@globex.com',
      name: 'Eve (Globex Owner)',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true
    }
  });

  const frank = await prisma.user.create({
    data: {
      email: 'frank@globex.com',
      name: 'Frank (Globex QA)',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true
    }
  });

  // 2. Create Organizations
  const acmeOrg = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      tier: 'ENTERPRISE'
    }
  });

  const globexOrg = await prisma.organization.create({
    data: {
      name: 'Globex Industries',
      slug: 'globex-industries',
      tier: 'PRO'
    }
  });

  // 3. Organization Memberships
  await prisma.organizationMember.createMany({
    data: [
      { organizationId: acmeOrg.id, userId: alice.id, role: 'OWNER' },
      { organizationId: acmeOrg.id, userId: bob.id, role: 'QA_ENGINEER' },
      { organizationId: acmeOrg.id, userId: charlie.id, role: 'DEVELOPER' },
      { organizationId: acmeOrg.id, userId: david.id, role: 'VIEWER' },
      { organizationId: acmeOrg.id, userId: grace.id, role: 'BILLING_MANAGER' },
      { organizationId: globexOrg.id, userId: eve.id, role: 'OWNER' },
      { organizationId: globexOrg.id, userId: frank.id, role: 'QA_ENGINEER' }
    ]
  });

  // 4. Teams
  const acmeCoreTeam = await prisma.team.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Core Platform Engineering',
      slug: 'core-platform'
    }
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: acmeCoreTeam.id, userId: alice.id, role: 'LEAD' },
      { teamId: acmeCoreTeam.id, userId: bob.id, role: 'MEMBER' },
      { teamId: acmeCoreTeam.id, userId: charlie.id, role: 'MEMBER' }
    ]
  });

  // 5. Acme Projects
  const storeProject = await prisma.project.create({
    data: {
      organizationId: acmeOrg.id,
      teamId: acmeCoreTeam.id,
      name: 'E-Commerce Storefront',
      slug: 'ecommerce-storefront',
      description: 'Customer facing Next.js storefront with cart, checkout, and search',
      category: 'ECOMMERCE',
      engineType: 'PLAYWRIGHT',
      repositoryUrl: 'https://github.com/acme/storefront',
      baseUrl: 'https://novaqa.thebuildflow.site',
      settings: {
        viewport: { width: 1280, height: 720 },
        captureScreenshotsOnFailure: true,
        recordVideo: true,
        autoHealEnabled: true
      }
    }
  });

  const apiProject = await prisma.project.create({
    data: {
      organizationId: acmeOrg.id,
      teamId: acmeCoreTeam.id,
      name: 'Order & Payment Gateway API',
      slug: 'orders-payment-api',
      description: 'Microservice handling customer orders, inventory checks, and Stripe webhooks',
      category: 'REST_API',
      engineType: 'API_REST',
      baseUrl: 'https://novaqa.thebuildflow.site',
      specUrl: 'https://novaqa.thebuildflow.site/docs/openapi.json',
      settings: {
        timeoutMs: 10000,
        validateSchema: true
      }
    }
  });

  // Globex Project (Tenant B)
  const globexProject = await prisma.project.create({
    data: {
      organizationId: globexOrg.id,
      name: 'Globex Logistics Portal',
      slug: 'globex-logistics',
      description: 'Internal fleet dispatch and tracking portal',
      category: 'SAAS',
      engineType: 'PLAYWRIGHT',
      baseUrl: 'https://logistics.globex.internal',
      settings: {
        autoHealEnabled: true
      }
    }
  });

  // 6. Environments
  const acmeStagingEnv = await prisma.environment.create({
    data: {
      projectId: storeProject.id,
      name: 'Staging Sandbox',
      slug: 'staging',
      baseUrl: 'https://novaqa.thebuildflow.site',
      isDefault: true
    }
  });

  const globexStagingEnv = await prisma.environment.create({
    data: {
      projectId: globexProject.id,
      name: 'Globex Staging',
      slug: 'globex-staging',
      baseUrl: 'https://staging.globex.internal',
      isDefault: true
    }
  });

  // 7. Test Suites & Cases for Acme
  const acmeSuite = await prisma.testSuite.create({
    data: {
      projectId: storeProject.id,
      name: 'Checkout & Cart Flow Suite',
      description: 'Critical business path: add to cart, apply coupon, fill checkout form, confirm order',
      tags: ['critical-path', 'smoke', 'p0'],
      isActive: true
    }
  });

  const cartTestCase = await prisma.testCase.create({
    data: {
      suiteId: acmeSuite.id,
      title: 'Should successfully add item to cart and update badge count',
      category: 'functional',
      priority: 'HIGH',
      expectedResult: 'Cart drawer opens and shows 1 item with total $49.00',
      codeSnippet: `await page.goto('https://novaqa.thebuildflow.site/pricing');\nawait expect(page.locator('h1')).toBeVisible();`,
      autoHealEnabled: true
    }
  });

  await prisma.testCaseStep.createMany({
    data: [
      { testCaseId: cartTestCase.id, order: 1, action: 'NAVIGATE', target: 'https://novaqa.thebuildflow.site/pricing', description: 'Open pricing page' },
      { testCaseId: cartTestCase.id, order: 2, action: 'ASSERT', target: 'h1', description: 'Assert heading is visible' }
    ]
  });

  // 8. Test Run & Finding for Acme
  const run = await prisma.testRun.create({
    data: {
      projectId: storeProject.id,
      suiteId: acmeSuite.id,
      environmentId: acmeStagingEnv.id,
      triggeredById: alice.id,
      triggerSource: 'MCP_AGENT',
      status: 'PASSED',
      totalTests: 1,
      passedTests: 1,
      failedTests: 0,
      skippedTests: 0,
      durationMs: 1450,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3598550)
    }
  });

  const res = await prisma.testResult.create({
    data: {
      testRunId: run.id,
      testCaseId: cartTestCase.id,
      status: 'PASSED',
      durationMs: 1450,
      stepResults: [
        { stepId: 'step-1', order: 1, action: 'NAVIGATE', status: 'PASSED', durationMs: 400 },
        { stepId: 'step-2', order: 2, action: 'ASSERT', status: 'PASSED', durationMs: 800 }
      ]
    }
  });

  // 9. API Keys
  const acmeRawApiKey = 'nqa_live_acme_secret_key_1234567890abcdef';
  await prisma.apiKey.create({
    data: {
      organizationId: acmeOrg.id,
      userId: alice.id,
      name: 'Acme CI/CD Pipeline & MCP Key',
      keyPrefix: acmeRawApiKey.substring(0, 12),
      hashedKey: hashApiKey(acmeRawApiKey),
      scope: 'ALL'
    }
  });

  const globexRawApiKey = 'nqa_live_globex_secret_key_abcdef1234567890';
  await prisma.apiKey.create({
    data: {
      organizationId: globexOrg.id,
      userId: eve.id,
      name: 'Globex MCP Key',
      keyPrefix: globexRawApiKey.substring(0, 12),
      hashedKey: hashApiKey(globexRawApiKey),
      scope: 'ALL'
    }
  });

  console.log('✅ NovaQA Multi-Tenant Seeding Complete!');
  console.log('Acme Users (Org A): alice@acme.com, bob@acme.com, charlie@acme.com, david@acme.com, grace@acme.com');
  console.log('Globex Users (Org B): eve@globex.com, frank@globex.com');
  console.log('Password for all users: Password123!');
  console.log(`Acme Raw API Key: ${acmeRawApiKey}`);
  console.log(`Globex Raw API Key: ${globexRawApiKey}`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
