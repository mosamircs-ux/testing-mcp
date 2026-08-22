import { describe, it, expect } from 'vitest';
import { JUnitReporter, MarkdownReporter } from './junit-reporter.js';
import { TestRunStatus, TestResultStatus, FindingCategory, FindingSeverity, FindingStatus } from '@novaqa/types';

describe('Reporting Package', () => {
  const mockData = {
    run: {
      id: 'run-test-123',
      projectId: 'prj-1',
      environmentId: 'env-1',
      triggerSource: 'MCP_AGENT' as const,
      status: TestRunStatus.PASSED,
      totalTests: 2,
      passedTests: 2,
      failedTests: 0,
      skippedTests: 0,
      durationMs: 1500,
      createdAt: new Date()
    },
    results: [
      {
        id: 'res-1',
        testRunId: 'run-test-123',
        testCaseId: 'case-1',
        testCaseTitle: 'Should login user with valid credentials',
        status: TestResultStatus.PASSED,
        durationMs: 750,
        stepResults: [],
        startedAt: new Date(),
        completedAt: new Date()
      },
      {
        id: 'res-2',
        testRunId: 'run-test-123',
        testCaseId: 'case-2',
        testCaseTitle: 'Should display dashboard after login',
        status: TestResultStatus.PASSED,
        durationMs: 750,
        stepResults: [],
        startedAt: new Date(),
        completedAt: new Date()
      }
    ],
    findings: []
  };

  it('should generate valid JUnit XML format', () => {
    const xml = JUnitReporter.generate(mockData);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<testsuite name="NovaQA Suite" tests="2"');
    expect(xml).toContain('name="Should login user with valid credentials"');
  });

  it('should generate formatted Markdown summary', () => {
    const md = MarkdownReporter.generate(mockData);
    expect(md).toContain('# NovaQA Test Run Summary');
    expect(md).toContain('100%');
    expect(md).toContain('Should login user with valid credentials');
  });
});
