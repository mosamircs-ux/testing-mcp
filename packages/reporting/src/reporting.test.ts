import { describe, it, expect, beforeAll } from 'vitest';
import {
  professionalReportEngine,
  ReportExporter,
  reportComparator,
  ReportType,
  ReportFormat
} from './index.js';
import { prisma } from '@novaqa/database';

describe('Professional Reporting System (@novaqa/reporting)', () => {
  let projectId: string;
  let runAId: string;
  let runBId: string;

  beforeAll(async () => {
    const org = (await prisma.organization.findFirst()) ||
      (await prisma.organization.create({ data: { name: 'Reporting Org', slug: `rep-org-${Date.now()}` } }));

    const project = await prisma.project.create({
      data: {
        organizationId: org.id,
        name: 'Enterprise Reporting Demo',
        slug: `rep-proj-${Date.now()}`,
        baseUrl: 'http://localhost:3000',
        environments: { create: { name: 'Staging Env', slug: 'staging', baseUrl: 'http://localhost:3000', isDefault: true } },
        testSuites: {
          create: {
            name: 'Core Suite',
            testCases: {
              create: [
                { title: 'User Login Authentication', expectedResult: 'Passed' },
                { title: 'Order Checkout Payment', expectedResult: 'Passed' }
              ]
            }
          }
        }
      },
      include: { environments: true, testSuites: { include: { testCases: true } } }
    });

    projectId = project.id;
    const testCases = project.testSuites[0].testCases;

    const runA = await prisma.testRun.create({
      data: {
        projectId,
        environmentId: project.environments[0].id,
        status: 'PASSED',
        totalTests: 2,
        passedTests: 2,
        failedTests: 0,
        durationMs: 14200,
        results: {
          create: [
            { testCaseId: testCases[0].id, status: 'PASSED', durationMs: 1200 },
            { testCaseId: testCases[1].id, status: 'PASSED', durationMs: 2400 }
          ]
        }
      }
    });
    runAId = runA.id;

    const runB = await prisma.testRun.create({
      data: {
        projectId,
        environmentId: project.environments[0].id,
        status: 'FAILED',
        totalTests: 2,
        passedTests: 1,
        failedTests: 1,
        durationMs: 16800,
        results: {
          create: [
            { testCaseId: testCases[0].id, status: 'PASSED', durationMs: 1100 },
            { testCaseId: testCases[1].id, status: 'FAILED', durationMs: 4200, errorMessage: 'Timeout waiting for payment modal' }
          ]
        }
      }
    });
    runBId = runB.id;
  });

  describe('1. Professional Report Generation (8 Core Types)', () => {
    it('should generate Test Execution Report with all required metrics', async () => {
      const report = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.TEST_EXECUTION,
        testRunId: runAId
      });

      expect(report.id).toBeDefined();
      expect(report.reportType).toBe(ReportType.TEST_EXECUTION);
      expect(report.executiveSummary).toBeDefined();
      expect(report.environment.name).toBeDefined();
      expect(report.applicationVersion).toBeDefined();
      expect(report.testsExecuted).toBeGreaterThan(0);
      expect(report.passRate).toBeGreaterThan(0);
      expect(report.coverage.overall).toBeGreaterThan(0);
      expect(report.screenshots.length).toBeGreaterThan(0);
      expect(report.evidence.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.shareToken).toBeDefined();
      expect(report.shareToken.length).toBeGreaterThanOrEqual(16);
    });

    it('should generate Regression, Release, Security, and Coverage reports', async () => {
      const regressionReport = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.REGRESSION
      });
      expect(regressionReport.reportType).toBe(ReportType.REGRESSION);
      expect(regressionReport.title).toContain('Regression');

      const releaseReport = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.RELEASE
      });
      expect(releaseReport.reportType).toBe(ReportType.RELEASE);
      expect(releaseReport.title).toContain('Release Candidate');

      const securityReport = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.SECURITY
      });
      expect(securityReport.reportType).toBe(ReportType.SECURITY);
      expect(securityReport.criticalIssues.length).toBeGreaterThan(0);

      const coverageReport = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.COVERAGE
      });
      expect(coverageReport.reportType).toBe(ReportType.COVERAGE);
      expect(coverageReport.coverage.routeCoverage).toBe(100);
    });

    it('should generate API, Mobile, and Performance reports', async () => {
      const apiReport = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.API
      });
      expect(apiReport.reportType).toBe(ReportType.API);

      const mobileReport = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.MOBILE
      });
      expect(mobileReport.reportType).toBe(ReportType.MOBILE);

      const perfReport = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.PERFORMANCE
      });
      expect(perfReport.reportType).toBe(ReportType.PERFORMANCE);
    });
  });

  describe('2. Multi-Format Exporters (PDF, HTML, JSON, CSV)', () => {
    it('should export report into HTML, PDF-printable HTML, JSON, and CSV', async () => {
      const report = await professionalReportEngine.generateReport({
        projectId,
        reportType: ReportType.TEST_EXECUTION
      });

      // JSON export
      const jsonExport = ReportExporter.export(report, ReportFormat.JSON);
      expect(jsonExport.mimeType).toBe('application/json');
      const parsedJson = JSON.parse(jsonExport.content);
      expect(parsedJson.id).toBe(report.id);

      // HTML export
      const htmlExport = ReportExporter.export(report, ReportFormat.HTML);
      expect(htmlExport.mimeType).toBe('text/html');
      expect(htmlExport.content).toContain('<!DOCTYPE html>');
      expect(htmlExport.content).toContain(report.title);

      // PDF export
      const pdfExport = ReportExporter.export(report, ReportFormat.PDF);
      expect(pdfExport.mimeType).toBe('text/html');
      expect(pdfExport.content).toContain('@media print');

      // CSV export
      const csvExport = ReportExporter.export(report, ReportFormat.CSV);
      expect(csvExport.mimeType).toBe('text/csv');
      expect(csvExport.content).toContain('Report ID');
      expect(csvExport.content).toContain(report.id);
    });
  });

  describe('3. Report & Run Comparison Engine (Run A vs Run B)', () => {
    it('should compare Run A and Run B and identify regressions, coverage, and performance changes', async () => {
      const comparison = await reportComparator.compareRuns({
        runAId,
        runBId,
        projectId
      });

      expect(comparison.runA.id).toBe(runAId);
      expect(comparison.runB.id).toBe(runBId);
      expect(comparison.summary.passRateDelta).toBeDefined();
      expect(comparison.regressions.length).toBeGreaterThan(0);
      expect(comparison.newFailures.length).toBeGreaterThan(0);
      expect(comparison.coverageChanges.delta).toBeDefined();
      expect(comparison.performanceChanges.deltaMs).toBeDefined();
      expect(comparison.securityChanges.currentScore).toBeGreaterThan(0);
    });
  });
});
