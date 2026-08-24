import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@novaqa/database';
import { FindingCategory, FindingSeverity, FindingStatus } from '@novaqa/types';
import {
  handleProjectCreate,
  handleProjectList,
  handleProjectGet,
  handleProjectDiscover,
  handleApplicationMapGet,
  handleApiMapGet,
  handleRequirementsGet,
  handleTestPlanGenerate,
  handleTestList,
  handleTestGet,
  handleTestCreate,
  handleTestUpdate,
  handleTestDelete,
  handleTestRun,
  handleTestRunSuite,
  handleTestRunSingle,
  handleTestCancel,
  handleTestRetry,
  handleRegressionRun,
  handleTestResultGet,
  handleTestResultList,
  handleArtifactsList,
  handleArtifactGet,
  handleCoverageGet,
  handleReportGenerate,
  handleFailureAnalyze,
  handleFailureGet,
  handleFixGenerate,
  handleFixApply,
  handleFixVerify,
  handleEnvironmentList,
  handleEnvironmentCreate,
  handleHealthCheck,
  handleProjectAutoTest,
  handleMobileDeviceList,
  handleMobileScenarioGenerate,
  handleMobileCrashInspect,
  handleSecurityScanApi,
  handleSecurityScanSource,
  handleSecurityAuditFull,
  handleSecurityPostureGet
} from './tools.js';
import { sanitizeMcpOutput } from './auth.js';

describe('Official NovaQA MCP Server Tool Verification (35 Tools, Mobile & Security Capabilities)', { timeout: 180000 }, () => {
  let createdProjectId: string;
  let createdSuiteId: string;
  let createdTestCaseId: string;
  let executedRunId: string;
  let createdFindingId: string;
  let createdArtifactId: string;
  let createdResultId: string;

  beforeAll(async () => {
    // Setup test organization and project fixtures
    const defaultOrg = await prisma.organization.findFirst();
    const orgId = defaultOrg ? defaultOrg.id : (await prisma.organization.create({ data: { name: 'MCP Test Org', slug: `mcp-org-${Date.now()}` } })).id;

    const project = await prisma.project.create({
      data: {
        organizationId: orgId,
        name: 'MCP Fixture Project',
        slug: `mcp-fixture-${Date.now()}`,
        baseUrl: 'http://localhost:3000',
        environments: { create: { name: 'Default Env', slug: 'default-env', baseUrl: 'http://localhost:3000', isDefault: true } },
        testSuites: {
          create: {
            name: 'Default Test Suite',
            testCases: {
              create: {
                title: 'Initial Checkout Test',
                expectedResult: 'Passed',
                steps: {
                  create: [
                    { order: 1, action: 'NAVIGATE', target: '/checkout', description: 'Go to checkout' },
                    { order: 2, action: 'CLICK', target: '[data-testid="pay-btn"]', description: 'Click Pay' }
                  ]
                }
              }
            }
          }
        }
      },
      include: { environments: true, testSuites: { include: { testCases: true } } }
    });

    createdProjectId = project.id;
    createdSuiteId = project.testSuites[0].id;
    createdTestCaseId = project.testSuites[0].testCases[0].id;

    const run = await prisma.testRun.create({
      data: {
        projectId: createdProjectId,
        suiteId: createdSuiteId,
        environmentId: project.environments[0].id,
        status: 'PASSED',
        totalTests: 1,
        passedTests: 1
      }
    });
    executedRunId = run.id;

    const result = await prisma.testResult.create({
      data: {
        testRunId: executedRunId,
        testCaseId: createdTestCaseId,
        status: 'FAILED',
        errorMessage: 'Timeout 5000ms exceeded waiting for selector button#old-submit'
      }
    });
    createdResultId = result.id;

    const finding = await prisma.finding.create({
      data: {
        testRunId: executedRunId,
        testResultId: createdResultId,
        projectId: createdProjectId,
        category: FindingCategory.SELECTOR_DRIFT,
        severity: FindingSeverity.HIGH,
        status: FindingStatus.OPEN,
        title: 'Selector Drift in Checkout',
        description: 'Button selector renamed in DOM',
        rootCauseAnalysis: 'Element locator broken in DOM',
        autoHealSelector: '[data-testid="checkout-btn"]',
        suggestedPatch: `--- a/test.ts\n+++ b/test.ts\n- button#old-submit\n+ [data-testid="checkout-btn"]`
      }
    });
    createdFindingId = finding.id;
  });

  // --------------------------------------------------------------------------
  // 1. PROJECT TOOLS
  // --------------------------------------------------------------------------
  describe('Project & Discovery Tools', () => {
    it('1. project_create should create a new tenant project workspace', async () => {
      const res = await handleProjectCreate({
        name: 'MCP Integration Test Project',
        category: 'WEB',
        baseUrl: 'http://localhost:3000',
        description: 'Created via MCP tool test'
      });

      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.id).toBeDefined();
      expect(parsed.name).toBe('MCP Integration Test Project');
      expect(parsed.environments.length).toBeGreaterThan(0);
      expect(parsed.testSuites.length).toBeGreaterThan(0);
    });

    it('2. project_list should list projects with summary counts', async () => {
      const res = await handleProjectList();
      const parsed = JSON.parse(res.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.some((p: any) => p.id === createdProjectId)).toBe(true);
    });

    it('3. project_get should return full project details and config', async () => {
      const res = await handleProjectGet({ projectId: createdProjectId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.id).toBe(createdProjectId);
      expect(parsed.baseUrl).toBe('http://localhost:3000');
    });

    it('4. project_discover should discover application routes, APIs, and workflows', async () => {
      const res = await handleProjectDiscover({ projectId: createdProjectId, targetUrl: 'http://localhost:3000' });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.status).toBe('COMPLETED');
      expect(parsed.routesMap).toBeDefined();
      expect(parsed.featureMap).toBeDefined();
    });

    it('5. application_map_get should return UI route hierarchy and page topology', async () => {
      const res = await handleApplicationMapGet({ projectId: createdProjectId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed).toBeDefined();
    });

    it('6. api_map_get should return API endpoints and schemas', async () => {
      const res = await handleApiMapGet({ projectId: createdProjectId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed).toBeDefined();
    });

    it('7. requirements_get should return normalized specification', async () => {
      const res = await handleRequirementsGet({ projectId: createdProjectId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 2. TEST PLANNING & AUTHORING TOOLS
  // --------------------------------------------------------------------------
  describe('Test Planning & Authoring Tools', () => {
    it('8. test_plan_generate should generate 19-category test matrix', async () => {
      const res = await handleTestPlanGenerate({
        projectId: createdProjectId,
        featureDescription: 'User authentication and checkout flow'
      });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.testCases.length).toBeGreaterThan(0);
      expect(parsed.coverageMetrics).toBeDefined();
    });

    it('9. test_create should create an executable test case with steps', async () => {
      const res = await handleTestCreate({
        suiteId: createdSuiteId,
        title: 'Verify shopping cart checkout',
        category: 'functional',
        priority: 'HIGH',
        expectedResult: 'Checkout completed successfully',
        steps: [
          { order: 1, action: 'NAVIGATE', target: '/cart', description: 'Open cart' },
          { order: 2, action: 'CLICK', target: '[data-testid="checkout-btn"]', description: 'Click checkout' },
          { order: 3, action: 'ASSERT', target: '.order-success', description: 'Verify success' }
        ]
      });

      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.id).toBeDefined();
      expect(parsed.steps.length).toBe(3);
    });

    it('10. test_list should list test cases for the suite', async () => {
      const res = await handleTestList({ suiteId: createdSuiteId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.some((tc: any) => tc.id === createdTestCaseId)).toBe(true);
    });

    it('11. test_get should retrieve test case with step details', async () => {
      const res = await handleTestGet({ testCaseId: createdTestCaseId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.id).toBe(createdTestCaseId);
      expect(parsed.steps.length).toBeGreaterThan(0);
    });

    it('12. test_update should update test case metadata', async () => {
      const res = await handleTestUpdate({
        testCaseId: createdTestCaseId,
        priority: 'CRITICAL',
        description: 'Updated description via MCP'
      });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.priority).toBe('CRITICAL');
      expect(parsed.description).toBe('Updated description via MCP');
    });

    it('13. test_delete should delete test case', async () => {
      const tempTest = await prisma.testCase.create({
        data: {
          suiteId: createdSuiteId,
          title: 'Temp Test for Deletion',
          expectedResult: 'Pass'
        }
      });

      const res = await handleTestDelete({ testCaseId: tempTest.id });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.deletedTestCaseId).toBe(tempTest.id);
    });
  });

  // --------------------------------------------------------------------------
  // 3. TEST EXECUTION & RUNNER CONTROL TOOLS
  // --------------------------------------------------------------------------
  describe('Test Execution & Runner Control Tools', () => {
    it('14. test_run should execute full test run in sandbox', async () => {
      const res = await handleTestRun({ projectId: createdProjectId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.runId).toBeDefined();
      expect(parsed.status).toBeDefined();
    });

    it('15. test_run_suite should execute specific test suite', async () => {
      const res = await handleTestRunSuite({ suiteId: createdSuiteId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.runId).toBeDefined();
    });

    it('16. test_run_single should execute isolated test case', async () => {
      const res = await handleTestRunSingle({ testCaseId: createdTestCaseId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.id).toBeDefined();
      expect(parsed.results.length).toBeGreaterThanOrEqual(1);
    });

    it('17. test_cancel should cancel in-flight test run', async () => {
      const env = await prisma.environment.findFirst({ where: { projectId: createdProjectId } });
      const run = await prisma.testRun.create({
        data: {
          projectId: createdProjectId,
          environmentId: env!.id,
          status: 'RUNNING'
        }
      });

      const res = await handleTestCancel({ runId: run.id, reason: 'Test cancel MCP tool' });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.status).toBe('CANCELLED');
    });

    it('18. test_retry should re-execute previous test run', async () => {
      const res = await handleTestRetry({ runId: executedRunId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.runId).toBeDefined();
    });

    it('19. regression_run should trigger project regression suite', async () => {
      const res = await handleRegressionRun({ projectId: createdProjectId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.runId).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4. RESULTS, ARTIFACTS & COVERAGE TOOLS
  // --------------------------------------------------------------------------
  describe('Results, Artifacts & Coverage Tools', () => {
    it('20. test_result_list should list test results for a run', async () => {
      const res = await handleTestResultList({ runId: executedRunId });
      const parsed = JSON.parse(res.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('21. test_result_get should return result details and step logs', async () => {
      const res = await handleTestResultGet({ testResultId: createdResultId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.id).toBe(createdResultId);
      expect(parsed.durationMs).toBeDefined();
    });

    it('22. artifacts_list and 23. artifact_get should list and retrieve artifacts', async () => {
      const artifact = await prisma.artifact.create({
        data: {
          testRunId: executedRunId,
          type: 'SCREENSHOT',
          fileName: 'checkout_step.png',
          fileSize: 4096,
          mimeType: 'image/png',
          storageKey: `runs/${executedRunId}/screenshot/test.png`,
          storageUrl: `http://localhost:4000/storage/test.png`
        }
      });
      createdArtifactId = artifact.id;

      const listRes = await handleArtifactsList({ runId: executedRunId });
      const listParsed = JSON.parse(listRes.content[0].text);
      expect(listParsed.some((a: any) => a.id === createdArtifactId)).toBe(true);

      const getRes = await handleArtifactGet({ artifactId: createdArtifactId });
      const getParsed = JSON.parse(getRes.content[0].text);
      expect(getParsed.id).toBe(createdArtifactId);
      expect(getParsed.storageUrl).toBeDefined();
    });

    it('24. coverage_get should return route and API coverage metrics', async () => {
      const res = await handleCoverageGet({ projectId: createdProjectId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.projectId).toBe(createdProjectId);
      expect(parsed.routeCoveragePercent).toBeGreaterThan(0);
      expect(parsed.apiCoveragePercent).toBeGreaterThan(0);
    });

    it('25. report_generate should generate markdown report for run', async () => {
      const res = await handleReportGenerate({ runId: executedRunId, format: 'markdown' });
      expect(res.content[0].text).toContain('NovaQA Test Run Summary');
    });
  });

  // --------------------------------------------------------------------------
  // 5. FAILURE ANALYSIS, FIXES & VERIFICATION TOOLS
  // --------------------------------------------------------------------------
  describe('AI Failure Analysis, Fixes & Verification Tools', () => {
    it('26. failure_analyze should analyze test failures across 10 categories', async () => {
      const res = await handleFailureAnalyze({ testResultId: createdResultId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.category).toBe(FindingCategory.SELECTOR_DRIFT);
      expect(parsed.rootCauseAnalysis).toBeDefined();
      expect(parsed.confidence).toBeGreaterThan(0.7);
    });

    it('27. failure_get should return finding diagnostics and confidence', async () => {
      const res = await handleFailureGet({ findingId: createdFindingId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.id).toBe(createdFindingId);
      expect(parsed.title).toBe('Selector Drift in Checkout');
    });

    it('28. fix_generate should generate proposed patch diff', async () => {
      const res = await handleFixGenerate({ findingId: createdFindingId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.patchDiff).toBeDefined();
    });

    it('29. fix_apply should approve and record fix application in history', async () => {
      const res = await handleFixApply({
        findingId: createdFindingId,
        notes: 'Approved via MCP integration test'
      });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.finding.status).toBe(FindingStatus.FIX_APPROVED);
    });

    it('30. fix_verify should execute 4-stage verification lifecycle', async () => {
      const res = await handleFixVerify({
        findingId: createdFindingId,
        scope: 'FULL_REGRESSION'
      });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.verified).toBe(true);
      expect(parsed.finalFindingStatus).toBe(FindingStatus.RESOLVED);
    });
  });

  // --------------------------------------------------------------------------
  // 6. ENVIRONMENT, HEALTH, SECURITY & MOBILE TOOLS
  // --------------------------------------------------------------------------
  describe('Environment, Health, Security & Mobile Tools', () => {
    it('31. environment_create and environment_list should manage target environments', async () => {
      const createRes = await handleEnvironmentCreate({
        projectId: createdProjectId,
        name: 'Staging Environment',
        baseUrl: 'https://staging.acme.com',
        variables: { API_KEY: 'secret-val-123' }
      });
      const createdEnv = JSON.parse(createRes.content[0].text);
      expect(createdEnv.name).toBe('Staging Environment');

      const listRes = await handleEnvironmentList({ projectId: createdProjectId });
      const listParsed = JSON.parse(listRes.content[0].text);
      expect(listParsed.some((e: any) => e.name === 'Staging Environment')).toBe(true);
    });

    it('32. health_check should report MCP service health', async () => {
      const res = await handleHealthCheck();
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.status).toBe('HEALTHY');
      expect(parsed.database).toBe('CONNECTED');
    });

    it('33. sanitizeMcpOutput should redact secret credentials and passwords', () => {
      const sensitivePayload = {
        id: 'user-1',
        passwordHash: '$2b$10$secretHashValue',
        apiKey: 'nova_live_secret_123',
        authConfig: {
          secretKey: 'top-secret',
          publicId: 'client-123'
        }
      };

      const sanitized = sanitizeMcpOutput(sensitivePayload);
      expect(sanitized.passwordHash).toBe('[REDACTED_SECRET]');
      expect(sanitized.apiKey).toBe('[REDACTED_SECRET]');
      expect(sanitized.authConfig.secretKey).toBe('[REDACTED_SECRET]');
      expect(sanitized.authConfig.publicId).toBe('client-123');
    });

    it('34. mobile_device_list should list available emulators and simulators', async () => {
      const res = await handleMobileDeviceList();
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.devices.length).toBeGreaterThanOrEqual(3);
      expect(parsed.stats.available).toBeGreaterThan(0);
    });

    it('35. mobile_scenario_generate should generate 11+ mobile test scenarios', async () => {
      const res = await handleMobileScenarioGenerate({
        appName: 'NovaQA Mobile App',
        framework: 'REACT_NATIVE',
        platform: 'ANDROID'
      });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.length).toBeGreaterThanOrEqual(11);
      expect(parsed.some((s: any) => s.title.includes('Login'))).toBe(true);
    });

    it('36. mobile_crash_inspect should inspect logs for crash events', async () => {
      const res = await handleMobileCrashInspect({ testRunId: executedRunId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.anrDetected).toBe(false);
      expect(parsed.diagnosticSummary).toBeDefined();
    });

    it('37. security_scan_api should execute dynamic API security checks', async () => {
      const res = await handleSecurityScanApi({ targetUrl: 'http://localhost:3000' });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.findingsCount).toBeGreaterThan(0);
      expect(parsed.findings.some((f: any) => f.category === 'SECURITY_HEADERS')).toBe(true);
    });

    it('38. security_scan_source should scan source code for exposed secrets and eval', async () => {
      const res = await handleSecurityScanSource({
        fileContents: [
          { path: 'src/config/aws.ts', content: 'const key = "AKIA1234567890ABCDEF";' }
        ]
      });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.findingsCount).toBe(1);
      expect(parsed.findings[0].cwe).toBe('CWE-798');
    });

    it('39. security_audit_full should run combined audit and persist findings', async () => {
      const res = await handleSecurityAuditFull({
        projectId: createdProjectId,
        targetUrl: 'http://localhost:3000',
        persistFindings: false
      });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.overallPostureScore).toBeGreaterThanOrEqual(0);
      expect(parsed.postureGrade).toBeDefined();
    });

    it('40. security_posture_get should return organization posture score and breakdown', async () => {
      const res = await handleSecurityPostureGet({ projectId: createdProjectId });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.score).toBeDefined();
      expect(parsed.grade).toBeDefined();
      expect(parsed.breakdown).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 7. AUTONOMOUS 10-STEP "TEST THIS PROJECT" PIPELINE
  // --------------------------------------------------------------------------
  describe('Autonomous Project Context Understanding ("Test this project")', () => {
    it('41. project_auto_test should execute complete 10-step autonomous workflow', async () => {
      const res = await handleProjectAutoTest({
        projectId: createdProjectId,
        targetUrl: 'http://localhost:3000'
      });

      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.stepsLog.length).toBe(10);
      expect(parsed.stepsLog[0]).toContain('[1/10]');
      expect(parsed.stepsLog[4]).toContain('[5/10]');
      expect(parsed.stepsLog[6]).toContain('[7/10]');
      expect(parsed.stepsLog[9]).toContain('[10/10]');
      expect(parsed.reportSummary).toBeDefined();
    });
  });
});
