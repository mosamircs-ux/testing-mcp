import { describe, it, expect, vi } from 'vitest';
import { PlaywrightEngine } from './playwright-engine.js';
import { ExecutionContext } from '@novaqa/testing';
import { TestCase, TestResultStatus, ArtifactType } from '@novaqa/types';

describe('Playwright Browser Test Engine', () => {
  it('should instantiate with default and custom options', () => {
    const engine = new PlaywrightEngine({
      browserType: 'chromium',
      viewport: { width: 390, height: 844, isMobile: true }
    });
    expect(engine.name).toBe('PlaywrightBrowserEngine');
  });

  it('should initialize and execute test case steps with variable interpolation', async () => {
    const engine = new PlaywrightEngine();
    const context = new ExecutionContext('run-pw-1', 'http://localhost:3000', {
      USERNAME: 'testuser@novaqa.dev',
      BASE_PATH: '/dashboard'
    });

    // Mock internal page and browser methods for sandbox test environment
    const mockPage: any = {
      goto: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockResolvedValue(undefined),
      fill: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-png-screenshot')),
      content: vi.fn().mockResolvedValue('<html><body><h1>Dashboard</h1></body></html>'),
      title: vi.fn().mockResolvedValue('NovaQA Dashboard'),
      url: vi.fn().mockResolvedValue('http://localhost:3000/dashboard'),
      on: vi.fn(),
      accessibility: {
        snapshot: vi.fn().mockResolvedValue({ role: 'WebArea', name: 'Dashboard' })
      },
      evaluate: vi.fn().mockResolvedValue({
        dnsLookupMs: 5,
        tcpHandshakeMs: 10,
        timeToFirstByteMs: 40,
        totalDurationMs: 120
      }),
      close: vi.fn().mockResolvedValue(undefined),
      video: vi.fn().mockReturnValue(null)
    };

    (engine as any).page = mockPage;

    const testCase: TestCase = {
      id: 'tc-pw-1',
      suiteId: 'suite-pw',
      title: 'Navigate and Verify Dashboard',
      category: 'UI',
      priority: 'HIGH',
      expectedResult: 'Dashboard rendered',
      isFlaky: false,
      flakinessScore: 0,
      autoHealEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [
        {
          id: 'step-1',
          testCaseId: 'tc-pw-1',
          order: 1,
          action: 'NAVIGATE',
          target: '{{BASE_PATH}}',
          description: 'Navigate to dashboard'
        },
        {
          id: 'step-2',
          testCaseId: 'tc-pw-1',
          order: 2,
          action: 'ASSERT',
          target: 'title',
          expectedOutput: 'Dashboard',
          description: 'Verify page title'
        }
      ]
    };

    const result = await engine.executeTestCase(testCase, context);
    expect(result.status).toBe(TestResultStatus.PASSED);
    expect(result.stepResults.length).toBe(2);
    expect(mockPage.goto).toHaveBeenCalledWith('http://localhost:3000/dashboard', expect.any(Object));

    // Verify artifacts generated
    expect(context.artifacts.some((a) => a.type === ArtifactType.DOM_SNAPSHOT)).toBe(true);
    expect(context.artifacts.some((a) => a.type === ArtifactType.SCREENSHOT)).toBe(true);
    expect(context.artifacts.some((a) => a.type === ArtifactType.ACCESSIBILITY_SNAPSHOT)).toBe(true);
    expect(context.artifacts.some((a) => a.type === ArtifactType.TIMING_METRICS)).toBe(true);
  });

  it('should handle step failures and capture failure screenshots', async () => {
    const engine = new PlaywrightEngine();
    const context = new ExecutionContext('run-pw-fail', 'http://localhost:3000');

    const mockPage: any = {
      goto: vi.fn().mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED at http://localhost:3000/missing')),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('failure-screenshot')),
      content: vi.fn().mockResolvedValue('<html><body>Error Page</body></html>'),
      on: vi.fn(),
      accessibility: { snapshot: vi.fn().mockResolvedValue(null) },
      evaluate: vi.fn().mockResolvedValue(null),
      close: vi.fn(),
      video: vi.fn().mockReturnValue(null)
    };

    (engine as any).page = mockPage;

    const testCase: TestCase = {
      id: 'tc-pw-fail',
      suiteId: 'suite-pw',
      title: 'Failed Navigation',
      category: 'Functional',
      priority: 'HIGH',
      expectedResult: 'Navigation fails',
      isFlaky: false,
      flakinessScore: 0,
      autoHealEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [
        {
          id: 'step-1',
          testCaseId: 'tc-pw-fail',
          order: 1,
          action: 'NAVIGATE',
          target: '/missing',
          description: 'Navigate to broken URL'
        }
      ]
    };

    const result = await engine.executeTestCase(testCase, context);
    expect(result.status).toBe(TestResultStatus.FAILED);
    expect(result.errorMessage).toContain('ERR_CONNECTION_REFUSED');
    expect(context.artifacts.some((a) => a.type === ArtifactType.SCREENSHOT)).toBe(true);
  });
});
