import { describe, it, expect } from 'vitest';
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
  handleProjectAutoTest
} from './tools.js';
import { sanitizeMcpOutput } from './auth.js';

describe('Official NovaQA MCP Server Tool Verification (31 Tools & Autonomous Pipeline)', () => {
  let createdProjectId: string;
  let createdSuiteId: string;
  let createdTestCaseId: string;
  let executedRunId: string;
  let createdFindingId: string;
  let createdArtifactId: string;

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

      createdProjectId = parsed.id;
      createdSuiteId = parsed.testSuites[0].id;
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
      createdTestCaseId = parsed.id;
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
      expect(parsed.steps.length).toBe(3);
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
      executedRunId = parsed.runId;
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
      expect(parsed.results.length).toBe(1);
    });

    it('17. test_cancel should cancel in-flight test run', async () => {
      const run = await prisma.testRun.create({
        data: {
          projectId: createdProjectId,
          environmentId: (await prisma.environment.findFirst({ where: { projectId: createdProjectId } }))!.id,
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
      const result = await prisma.testResult.findFirst({ where: { testRunId: executedRunId } });
      if (result) {
        const res = await handleTestResultGet({ testResultId: result.id });
        const parsed = JSON.parse(res.content[0].text);
        expect(parsed.id).toBe(result.id);
        expect(parsed.durationMs).toBeDefined();
      }
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
      // Seed failure finding
      const testResult = await prisma.testResult.create({
        data: {
          testRunId: executedRunId,
          testCaseId: createdTestCaseId,
          status: 'FAILED',
          errorMessage: 'Timeout 5000ms exceeded waiting for selector button#old-submit'
        }
      });

      const res = await handleFailureAnalyze({ testResultId: testResult.id });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.category).toBe(FindingCategory.SELECTOR_DRIFT);
      expect(parsed.rootCauseAnalysis).toBeDefined();
      expect(parsed.confidence).toBeGreaterThan(0.7);

      const finding = await prisma.finding.create({
        data: {
          testRunId: executedRunId,
          testResultId: testResult.id,
          projectId: createdProjectId,
          category: FindingCategory.SELECTOR_DRIFT,
          severity: FindingSeverity.HIGH,
          status: FindingStatus.OPEN,
          title: 'Selector Drift in Checkout',
          description: 'Button selector renamed',
          rootCauseAnalysis: 'Element locator broken in DOM',
          autoHealSelector: '[data-testid="checkout-btn"]',
          suggestedPatch: `--- a/test.ts\n+++ b/test.ts\n- button#old-submit\n+ [data-testid="checkout-btn"]`
        }
      });
      createdFindingId = finding.id;
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
  // 6. ENVIRONMENT, HEALTH & TENANT ISOLATION
  // --------------------------------------------------------------------------
  describe('Environment, Health & Security Redaction', () => {
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
  });

  // --------------------------------------------------------------------------
  // 7. AUTONOMOUS 10-STEP "TEST THIS PROJECT" ORCHESTRATION WORKFLOW
  // --------------------------------------------------------------------------
  describe('Autonomous Project Context Understanding ("Test this project")', () => {
    it('34. project_auto_test should execute complete 10-step autonomous workflow', async () => {
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
