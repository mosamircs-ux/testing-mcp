import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NovaQA database...');

  // 1. Cleanup existing records
  await prisma.auditLog.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.testRun.deleteMany();
  await prisma.testCaseStep.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.testSuite.deleteMany();
  await prisma.environment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.mcpSession.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.usageMetric.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const passwordHash = await bcrypt.hash('NovaQA2026!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@novaqa.dev',
      name: 'Sarah Connor',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    }
  });

  const devUser = await prisma.user.create({
    data: {
      email: 'dev@novaqa.dev',
      name: 'Alex Rivera',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    }
  });

  // 3. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Technologies',
      slug: 'acme-corp',
      tier: 'PRO',
      members: {
        create: [
          { userId: adminUser.id, role: 'OWNER' },
          { userId: devUser.id, role: 'ENGINEER' }
        ]
      },
      subscription: {
        create: {
          tier: 'PRO',
          status: 'active'
        }
      }
    }
  });

  // 4. Create API Key for MCP / IDE connection
  const apiKeySalt = process.env.API_KEY_SALT || 'novaqa-secret-api-key-salt';
  const sampleRawKey = 'nqa_live_9f83a8b417e92384a7e9182374b8912c';
  const hashedApiKey = crypto.createHmac('sha256', apiKeySalt).update(sampleRawKey).digest('hex');

  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId: org.id,
      userId: adminUser.id,
      name: 'Cursor & Antigravity MCP Key',
      keyPrefix: 'nqa_live_9f8',
      hashedKey: hashedApiKey
    }
  });

  await prisma.mcpSession.create({
    data: {
      apiKeyId: apiKey.id,
      clientName: 'Cursor AI',
      clientVersion: '0.45.2',
      ipAddress: '127.0.0.1'
    }
  });

  // 5. Create Projects
  const webProject = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'E-Commerce Storefront',
      slug: 'ecommerce-storefront',
      description: 'Customer facing Next.js storefront with cart, checkout, and search',
      category: 'ECOMMERCE',
      engineType: 'PLAYWRIGHT',
      baseUrl: 'http://localhost:3000',
      repositoryUrl: 'https://github.com/acme/storefront',
      settings: JSON.stringify({
        viewport: { width: 1280, height: 720 },
        captureScreenshotsOnFailure: true,
        recordVideo: true,
        autoHealEnabled: true
      })
    }
  });

  const apiProject = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Order & Payment Gateway API',
      slug: 'orders-payment-api',
      description: 'Microservice handling customer orders, inventory checks, and Stripe webhooks',
      category: 'REST_API',
      engineType: 'API_REST',
      baseUrl: 'http://localhost:4000',
      specUrl: 'http://localhost:4000/docs/openapi.json',
      settings: JSON.stringify({
        timeoutMs: 10000,
        validateSchema: true
      })
    }
  });

  // 6. Create Environments
  const webProdEnv = await prisma.environment.create({
    data: {
      projectId: webProject.id,
      name: 'Production',
      slug: 'production',
      baseUrl: 'https://storefront.acme.com',
      isDefault: false
    }
  });

  const webStagingEnv = await prisma.environment.create({
    data: {
      projectId: webProject.id,
      name: 'Staging Sandbox',
      slug: 'staging',
      baseUrl: 'http://localhost:3000',
      isDefault: true
    }
  });

  const apiStagingEnv = await prisma.environment.create({
    data: {
      projectId: apiProject.id,
      name: 'Staging API',
      slug: 'staging-api',
      baseUrl: 'http://localhost:4000',
      isDefault: true
    }
  });

  // 7. Create Test Suites & Cases for Web Project
  const checkoutSuite = await prisma.testSuite.create({
    data: {
      projectId: webProject.id,
      name: 'Checkout & Cart Flow Suite',
      description: 'Critical business path: add to cart, apply coupon, fill checkout form, confirm order',
      tags: JSON.stringify(['critical-path', 'smoke', 'p0'])
    }
  });

  const testCase1 = await prisma.testCase.create({
    data: {
      suiteId: checkoutSuite.id,
      title: 'Should successfully add item to cart and update badge count',
      category: 'functional',
      priority: 'CRITICAL',
      expectedResult: 'Cart drawer opens with item added and badge counter showing 1',
      codeSnippet: `await page.goto('/products/classic-tee');\nawait page.click('[data-testid="add-to-cart"]');\nawait expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1');`,
      steps: {
        create: [
          { order: 1, action: 'NAVIGATE', target: '/products/classic-tee', description: 'Navigate to product detail page' },
          { order: 2, action: 'CLICK', target: '[data-testid="add-to-cart"]', description: 'Click Add to Cart button' },
          { order: 3, action: 'ASSERT', target: '[data-testid="cart-badge"]', description: 'Assert cart badge displays count 1', expectedOutput: '1' }
        ]
      }
    }
  });

  const testCase2 = await prisma.testCase.create({
    data: {
      suiteId: checkoutSuite.id,
      title: 'Should apply discount promo code SAVE20 and recalculate total',
      category: 'functional',
      priority: 'HIGH',
      expectedResult: 'Total price decreases by 20% with discount banner displayed',
      steps: {
        create: [
          { order: 1, action: 'NAVIGATE', target: '/checkout', description: 'Navigate to checkout page' },
          { order: 2, action: 'TYPE', target: 'input[name="coupon"]', value: 'SAVE20', description: 'Enter promo code SAVE20' },
          { order: 3, action: 'CLICK', target: 'button[id="apply-coupon-btn"]', description: 'Click apply promo button' },
          { order: 4, action: 'ASSERT', target: '.discount-applied-tag', description: 'Verify discount confirmation tag' }
        ]
      }
    }
  });

  // 8. Create Test Suites & Cases for API Project
  const ordersApiSuite = await prisma.testSuite.create({
    data: {
      projectId: apiProject.id,
      name: 'Order Lifecycle Contract Tests',
      description: 'API endpoint validations for POST /api/orders and GET /api/orders/:id',
      tags: JSON.stringify(['api', 'contract', 'regression'])
    }
  });

  await prisma.testCase.create({
    data: {
      suiteId: ordersApiSuite.id,
      title: 'POST /api/v1/orders - create valid order with items',
      category: 'contract',
      priority: 'CRITICAL',
      expectedResult: 'Returns 201 Created with generated orderId and status PENDING',
      steps: {
        create: [
          { order: 1, action: 'REQUEST', target: 'POST /api/v1/orders', value: JSON.stringify({ items: [{ id: 'p1', qty: 2 }] }), description: 'Submit order creation payload' },
          { order: 2, action: 'ASSERT', target: 'status', expectedOutput: '201', description: 'Assert HTTP 201 response status' }
        ]
      }
    }
  });

  // 9. Create Historical Test Run & Execution Results
  const testRun = await prisma.testRun.create({
    data: {
      projectId: webProject.id,
      suiteId: checkoutSuite.id,
      environmentId: webStagingEnv.id,
      triggeredById: adminUser.id,
      triggerSource: 'MCP_AGENT',
      status: 'FAILED',
      totalTests: 2,
      passedTests: 1,
      failedTests: 1,
      skippedTests: 0,
      durationMs: 4320,
      startedAt: new Date(Date.now() - 1000 * 60 * 15),
      completedAt: new Date(Date.now() - 1000 * 60 * 14)
    }
  });

  // Test Case 1 Result (Passed)
  await prisma.testResult.create({
    data: {
      testRunId: testRun.id,
      testCaseId: testCase1.id,
      status: 'PASSED',
      durationMs: 1420,
      startedAt: new Date(Date.now() - 1000 * 60 * 15),
      completedAt: new Date(Date.now() - 1000 * 60 * 14.5),
      stepResults: JSON.stringify([
        { order: 1, action: 'NAVIGATE', status: 'PASSED', durationMs: 400 },
        { order: 2, action: 'CLICK', status: 'PASSED', durationMs: 500 },
        { order: 3, action: 'ASSERT', status: 'PASSED', durationMs: 520 }
      ])
    }
  });

  // Test Case 2 Result (Failed - Flaky selector / Button renamed)
  const failedResult = await prisma.testResult.create({
    data: {
      testRunId: testRun.id,
      testCaseId: testCase2.id,
      status: 'FAILED',
      durationMs: 2900,
      errorMessage: 'locator.click: Target closed waiting for selector `button[id="apply-coupon-btn"]`',
      stackTrace: `Error: locator.click: Timeout 2500ms exceeded.\n  waiting for locator('button[id="apply-coupon-btn"]')\n  at CheckoutPage.applyCoupon (/apps/web/e2e/checkout.spec.ts:42:24)`,
      startedAt: new Date(Date.now() - 1000 * 60 * 14.5),
      completedAt: new Date(Date.now() - 1000 * 60 * 14),
      stepResults: JSON.stringify([
        { order: 1, action: 'NAVIGATE', status: 'PASSED', durationMs: 350 },
        { order: 2, action: 'TYPE', status: 'PASSED', durationMs: 450 },
        { order: 3, action: 'CLICK', status: 'FAILED', durationMs: 2100, error: 'Element `button[id="apply-coupon-btn"]` not found in DOM after 2000ms' }
      ])
    }
  });

  // 10. Create AI Finding for the Failure
  await prisma.finding.create({
    data: {
      testRunId: testRun.id,
      testResultId: failedResult.id,
      projectId: webProject.id,
      category: 'FLAKY_TEST',
      severity: 'MEDIUM',
      status: 'OPEN',
      title: 'Selector Drift: Apply coupon button ID changed in DOM',
      description: 'Test failed looking for button[id="apply-coupon-btn"]. DOM inspection shows the element now has data-testid="checkout-coupon-submit" and class="btn-coupon-apply".',
      rootCauseAnalysis: 'Recent frontend refactor updated checkout component IDs to standardized data-testid attributes. The test selector was hardcoded to an old ID.',
      suggestedFix: 'Update test selector from button[id="apply-coupon-btn"] to button[data-testid="checkout-coupon-submit"].',
      suggestedPatch: `--- a/apps/web/e2e/checkout.spec.ts\n+++ b/apps/web/e2e/checkout.spec.ts\n@@ -42,3 +42,3 @@\n-    await page.click('button[id="apply-coupon-btn"]');\n+    await page.click('[data-testid="checkout-coupon-submit"]');`,
      autoHealSelector: '[data-testid="checkout-coupon-submit"]',
      rawLogExcerpt: 'Console: [Warn] coupon button clicked before hydration finished'
    }
  });

  // 11. Create Artifacts for Test Run
  await prisma.artifact.create({
    data: {
      testRunId: testRun.id,
      testResultId: failedResult.id,
      type: 'SCREENSHOT',
      fileName: 'failure_checkout_step3.png',
      fileSize: 142850,
      mimeType: 'image/png',
      storageKey: `runs/${testRun.id}/screenshots/failure_step3.png`,
      metadata: JSON.stringify({ stepOrder: 3, width: 1280, height: 720 })
    }
  });

  await prisma.artifact.create({
    data: {
      testRunId: testRun.id,
      testResultId: failedResult.id,
      type: 'DOM_SNAPSHOT',
      fileName: 'dom_checkout_step3.html',
      fileSize: 45200,
      mimeType: 'text/html',
      storageKey: `runs/${testRun.id}/dom/checkout_step3.html`,
      metadata: JSON.stringify({ elementCount: 340 })
    }
  });

  // 12. Create Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: adminUser.id,
      action: 'TEST_RUN_TRIGGERED',
      resourceType: 'TestRun',
      resourceId: testRun.id,
      payload: JSON.stringify({ triggerSource: 'MCP_AGENT', suiteId: checkoutSuite.id }),
      ipAddress: '127.0.0.1'
    }
  });

  console.log('✅ Seed completed successfully!');
  console.log(`👤 Admin: ${adminUser.email} (Password: NovaQA2026!)`);
  console.log(`🔑 Demo MCP API Key: ${sampleRawKey}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
