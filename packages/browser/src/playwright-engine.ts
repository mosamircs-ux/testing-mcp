import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { TestEngine, ExecutionContext, TestEngineResult } from '@novaqa/testing';
import {
  TestCase,
  TestResultStatus,
  TestStepResult,
  ArtifactType,
  BrowserType,
  ViewportConfig,
  NetworkInterceptionEntry,
  NetworkTimingMetrics
} from '@novaqa/types';
import { loadConfig, createChildLogger } from '@novaqa/shared';

const log = createChildLogger('playwright-engine');
const config = loadConfig();

export interface PlaywrightEngineOptions {
  browserType?: BrowserType;
  viewport?: ViewportConfig;
  recordVideo?: boolean;
  recordTrace?: boolean;
  captureNetwork?: boolean;
  captureAccessibility?: boolean;
}

export class PlaywrightEngine implements TestEngine {
  public readonly name = 'PlaywrightBrowserEngine';
  private browser: Browser | null = null;
  private browserContext: BrowserContext | null = null;
  private page: Page | null = null;
  private currentContext: ExecutionContext | null = null;
  private options: PlaywrightEngineOptions = {};
  private tempArtifactDir = '';
  private traceFilePath = '';
  private requestStartTimes = new Map<string, number>();

  constructor(options: PlaywrightEngineOptions = {}) {
    this.options = options;
  }

  async initialize(context: ExecutionContext): Promise<void> {
    this.currentContext = context;
    context.checkCancellation();

    const browserName = (context.variables['BROWSER'] ||
      context.variables['BROWSER_TYPE'] ||
      this.options.browserType ||
      'chromium').toLowerCase() as BrowserType;

    const isMobile =
      context.variables['IS_MOBILE'] === 'true' ||
      context.variables['DEVICE_TYPE'] === 'mobile' ||
      this.options.viewport?.isMobile ||
      false;

    const viewportWidth = parseInt(context.variables['VIEWPORT_WIDTH'] || '', 10) || (isMobile ? 390 : 1280);
    const viewportHeight = parseInt(context.variables['VIEWPORT_HEIGHT'] || '', 10) || (isMobile ? 844 : 720);

    this.tempArtifactDir = path.resolve(config.STORAGE_LOCAL_PATH, 'temp', context.runId);
    await fs.mkdir(this.tempArtifactDir, { recursive: true });
    this.traceFilePath = path.join(this.tempArtifactDir, `trace_${Date.now()}.zip`);

    context.log(`Initializing Playwright (${browserName}) [${viewportWidth}x${viewportHeight}${isMobile ? ' Mobile' : ' Desktop'}]...`);

    try {
      const launchOptions = {
        headless: config.PLAYWRIGHT_HEADLESS,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      };

      if (browserName === 'firefox') {
        this.browser = await firefox.launch(launchOptions);
      } else if (browserName === 'webkit') {
        this.browser = await webkit.launch(launchOptions);
      } else {
        this.browser = await chromium.launch(launchOptions);
      }

      const contextOptions: Parameters<Browser['newContext']>[0] = {
        viewport: { width: viewportWidth, height: viewportHeight },
        isMobile,
        hasTouch: isMobile,
        userAgent: isMobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : undefined,
        recordVideo: {
          dir: path.join(this.tempArtifactDir, 'videos'),
          size: { width: viewportWidth, height: viewportHeight }
        },
        ignoreHTTPSErrors: true
      };

      this.browserContext = await this.browser.newContext(contextOptions);

      // Start Playwright Tracing
      await this.browserContext.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true
      });

      this.page = await this.browserContext.newPage();

      // 1. Console Log Interception
      this.page.on('console', (msg) => {
        const type = msg.type() as any;
        const text = msg.text();
        const location = msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined;
        context.addConsoleLog(type, text, location);
      });

      // 2. Uncaught Error Interception
      this.page.on('pageerror', (err) => {
        context.addConsoleLog('error', `Uncaught Exception: ${err.message}\n${err.stack || ''}`);
      });

      // 3. Network Interception
      this.page.on('request', (req) => {
        const reqId = `${req.method()}_${req.url()}_${Date.now()}`;
        this.requestStartTimes.set(req.url(), Date.now());
      });

      this.page.on('response', async (res) => {
        const startTime = this.requestStartTimes.get(res.url()) || Date.now();
        const durationMs = Date.now() - startTime;
        const entry: NetworkInterceptionEntry = {
          id: `net_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          url: res.url(),
          method: res.request().method(),
          resourceType: res.request().resourceType(),
          status: res.status(),
          requestHeaders: res.request().headers(),
          responseHeaders: res.headers(),
          durationMs
        };
        context.addNetworkEntry(entry);
      });

      this.page.on('requestfailed', (req) => {
        const startTime = this.requestStartTimes.get(req.url()) || Date.now();
        const durationMs = Date.now() - startTime;
        const entry: NetworkInterceptionEntry = {
          id: `net_fail_${Date.now()}`,
          url: req.url(),
          method: req.method(),
          resourceType: req.resourceType(),
          status: 0,
          requestHeaders: req.headers(),
          responseHeaders: {},
          durationMs,
          failed: true,
          failureText: req.failure()?.errorText || 'Failed'
        };
        context.addNetworkEntry(entry);
      });

      context.log(`Playwright browser context and page created successfully.`);
    } catch (err: any) {
      log.error({ err: err.message }, 'Failed to initialize Playwright browser');
      throw new Error(`Playwright Initialization Error: ${err.message}`);
    }
  }

  async executeTestCase(testCase: TestCase, context: ExecutionContext): Promise<TestEngineResult> {
    const startTime = Date.now();
    const stepResults: TestStepResult[] = [];
    let overallStatus: TestResultStatus = TestResultStatus.PASSED;
    let errorMessage: string | undefined;
    let stackTrace: string | undefined;

    context.checkCancellation();
    context.log(`Starting Playwright execution for test case: "${testCase.title}"`);
    context.emitEvent('TEST_STARTED', { testCaseId: testCase.id, title: testCase.title });

    for (const step of testCase.steps) {
      context.checkCancellation();
      const stepStartTime = Date.now();

      // Interpolate dynamic variables in target and value
      const target = step.target ? context.interpolate(step.target) : undefined;
      const value = step.value ? context.interpolate(step.value) : undefined;
      const expectedOutput = step.expectedOutput ? context.interpolate(step.expectedOutput) : undefined;

      context.emitEvent('STEP_STARTED', {
        testCaseId: testCase.id,
        stepOrder: step.order,
        action: step.action,
        target,
        value
      });

      try {
        if (!this.page) {
          throw new Error('Playwright page is not initialized');
        }

        await this.executePlaywrightStep({ ...step, target, value, expectedOutput }, context);

        const duration = Date.now() - stepStartTime;
        stepResults.push({
          stepId: step.id || `step-${step.order}`,
          order: step.order,
          action: step.action,
          target,
          status: 'PASSED',
          durationMs: duration
        });

        context.emitEvent('STEP_COMPLETED', {
          testCaseId: testCase.id,
          stepOrder: step.order,
          durationMs: duration
        });
      } catch (err: any) {
        const duration = Date.now() - stepStartTime;
        overallStatus = TestResultStatus.FAILED;
        errorMessage = err.message || 'Unknown step execution error';
        stackTrace = err.stack;

        context.log(`❌ Step ${step.order} (${step.action}) FAILED: ${errorMessage}`);

        // Capture failure screenshot & DOM snapshot
        if (this.page) {
          try {
            const screenshot = await this.page.screenshot({ fullPage: true });
            context.addArtifact(
              ArtifactType.SCREENSHOT,
              `failure_step_${step.order}_${Date.now()}.png`,
              screenshot,
              'image/png',
              { stepOrder: step.order, error: errorMessage }
            );

            const dom = await this.page.content();
            context.addArtifact(
              ArtifactType.DOM_SNAPSHOT,
              `dom_step_${step.order}_${Date.now()}.html`,
              Buffer.from(dom, 'utf-8'),
              'text/html',
              { stepOrder: step.order }
            );
          } catch (captureErr: any) {
            context.log(`Warning: Failed to capture failure screenshot: ${captureErr.message}`);
          }
        }

        stepResults.push({
          stepId: step.id || `step-${step.order}`,
          order: step.order,
          action: step.action,
          target,
          status: 'FAILED',
          durationMs: duration,
          error: errorMessage
        });

        context.emitEvent('STEP_FAILED', {
          testCaseId: testCase.id,
          stepOrder: step.order,
          error: errorMessage
        });

        break; // Stop further steps on failure
      }
    }

    // Capture post-test artifacts (Accessibility Snapshot, Performance Metrics, Console, Network)
    if (this.page) {
      try {
        // 1. Accessibility Snapshot
        if ((this.page as any)?.accessibility) {
          const a11ySnapshot = await (this.page as any).accessibility.snapshot();
          if (a11ySnapshot) {
            context.addArtifact(
              ArtifactType.ACCESSIBILITY_SNAPSHOT,
              `a11y_${testCase.id || 'case'}_${Date.now()}.json`,
              Buffer.from(JSON.stringify(a11ySnapshot, null, 2), 'utf-8'),
              'application/json'
            );
          }
        }

        // 2. DOM Snapshot on Passed test
        if (overallStatus === TestResultStatus.PASSED) {
          const domContent = await this.page.content();
          context.addArtifact(
            ArtifactType.DOM_SNAPSHOT,
            `dom_${testCase.id || 'case'}_${Date.now()}.html`,
            Buffer.from(domContent, 'utf-8'),
            'text/html'
          );

          const finalScreenshot = await this.page.screenshot({ fullPage: true });
          context.addArtifact(
            ArtifactType.SCREENSHOT,
            `screenshot_${testCase.id || 'case'}_${Date.now()}.png`,
            finalScreenshot,
            'image/png'
          );
        }

        // 3. Timing / Navigation Metrics
        const perfMetrics = await this.page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (nav) {
            return {
              dnsLookupMs: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
              tcpHandshakeMs: Math.round(nav.connectEnd - nav.connectStart),
              tlsNegotiationMs: nav.secureConnectionStart ? Math.round(nav.connectEnd - nav.secureConnectionStart) : 0,
              timeToFirstByteMs: Math.round(nav.responseStart - nav.requestStart),
              domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
              loadCompleteMs: Math.round(nav.loadEventEnd - nav.startTime),
              totalDurationMs: Math.round(nav.duration)
            };
          }
          return { totalDurationMs: 0, timeToFirstByteMs: 0 };
        }).catch(() => null);

        if (perfMetrics) {
          context.addArtifact(
            ArtifactType.TIMING_METRICS,
            `timing_${testCase.id || 'case'}_${Date.now()}.json`,
            Buffer.from(JSON.stringify(perfMetrics, null, 2), 'utf-8'),
            'application/json'
          );
          context.emitEvent('TIMING_METRIC', { testCaseId: testCase.id, metrics: perfMetrics });
        }
      } catch (postCaptureErr: any) {
        context.log(`Warning during post-test artifact collection: ${postCaptureErr.message}`);
      }
    }

    // 4. Console Logs Artifact
    if (context.consoleLogs.length > 0) {
      context.addArtifact(
        ArtifactType.CONSOLE_LOG,
        `console_${testCase.id || 'case'}_${Date.now()}.json`,
        Buffer.from(JSON.stringify(context.consoleLogs, null, 2), 'utf-8'),
        'application/json'
      );
    }

    // 5. Network Information Artifact
    if (context.networkEntries.length > 0) {
      context.addArtifact(
        ArtifactType.NETWORK_HAR,
        `network_${testCase.id || 'case'}_${Date.now()}.json`,
        Buffer.from(JSON.stringify(context.networkEntries, null, 2), 'utf-8'),
        'application/json'
      );
    }

    const durationMs = Date.now() - startTime;
    context.emitEvent('TEST_COMPLETED', {
      testCaseId: testCase.id,
      status: overallStatus,
      durationMs
    });

    return {
      status: overallStatus,
      durationMs,
      errorMessage,
      stackTrace,
      stepResults
    };
  }

  private async executePlaywrightStep(
    step: { action: string; target?: string; value?: string; expectedOutput?: string; order: number },
    context: ExecutionContext
  ): Promise<void> {
    const page = this.page;
    if (!page) throw new Error('Page is null');

    const timeout = context.variables['TIMEOUT_MS']
      ? parseInt(context.variables['TIMEOUT_MS'], 10)
      : process.env.NODE_ENV === 'test'
      ? 5000
      : config.PLAYWRIGHT_TIMEOUT_MS;
    const action = step.action.toUpperCase();

    switch (action) {
      case 'NAVIGATE':
      case 'GOTO': {
        const rawTarget = step.target || '/';
        const targetUrl = rawTarget.startsWith('http://') || rawTarget.startsWith('https://')
          ? rawTarget
          : `${context.environmentBaseUrl.replace(/\/$/, '')}/${rawTarget.replace(/^\//, '')}`;
        context.log(`Navigating to: ${targetUrl}`);
        await page.goto(targetUrl, { timeout, waitUntil: 'domcontentloaded' });
        break;
      }

      case 'CLICK': {
        if (!step.target) throw new Error('CLICK step requires a target selector');
        context.log(`Clicking element: ${step.target}`);
        await page.click(step.target, { timeout });
        break;
      }

      case 'DBLCLICK': {
        if (!step.target) throw new Error('DBLCLICK step requires a target selector');
        context.log(`Double clicking element: ${step.target}`);
        await page.dblclick(step.target, { timeout });
        break;
      }

      case 'TYPE':
      case 'FILL': {
        if (!step.target) throw new Error('FILL/TYPE step requires a target selector');
        const textToFill = step.value || '';
        context.log(`Typing into '${step.target}': ${textToFill}`);
        await page.fill(step.target, textToFill, { timeout });
        break;
      }

      case 'CHECK': {
        if (!step.target) throw new Error('CHECK step requires a target selector');
        context.log(`Checking checkbox/radio: ${step.target}`);
        await page.check(step.target, { timeout });
        break;
      }

      case 'UNCHECK': {
        if (!step.target) throw new Error('UNCHECK step requires a target selector');
        context.log(`Unchecking checkbox: ${step.target}`);
        await page.uncheck(step.target, { timeout });
        break;
      }

      case 'SELECT':
      case 'SELECT_OPTION': {
        if (!step.target) throw new Error('SELECT step requires a target selector');
        context.log(`Selecting option '${step.value}' on ${step.target}`);
        await page.selectOption(step.target, step.value || '', { timeout });
        break;
      }

      case 'HOVER': {
        if (!step.target) throw new Error('HOVER step requires a target selector');
        context.log(`Hovering over element: ${step.target}`);
        await page.hover(step.target, { timeout });
        break;
      }

      case 'SCROLL': {
        if (step.target) {
          context.log(`Scrolling to element: ${step.target}`);
          await page.locator(step.target).scrollIntoViewIfNeeded({ timeout });
        } else {
          const pixels = parseInt(step.value || '500', 10);
          context.log(`Scrolling page by ${pixels}px`);
          await page.evaluate((y) => window.scrollBy(0, y), pixels);
        }
        break;
      }

      case 'PRESS':
      case 'KEYPRESS': {
        const key = step.value || 'Enter';
        if (step.target) {
          context.log(`Pressing key '${key}' on ${step.target}`);
          await page.press(step.target, key, { timeout });
        } else {
          context.log(`Pressing key '${key}' on page`);
          await page.keyboard.press(key);
        }
        break;
      }

      case 'DRAG':
      case 'DRAG_AND_DROP': {
        if (!step.target || !step.value) throw new Error('DRAG step requires target (source) and value (destination selector)');
        context.log(`Dragging from ${step.target} to ${step.value}`);
        await page.dragAndDrop(step.target, step.value, { timeout });
        break;
      }

      case 'WAIT':
      case 'WAIT_FOR': {
        if (step.target) {
          context.log(`Waiting for selector: ${step.target}`);
          await page.waitForSelector(step.target, { timeout });
        } else {
          const ms = parseInt(step.value || '1000', 10);
          context.log(`Waiting for ${ms}ms...`);
          await page.waitForTimeout(ms);
        }
        break;
      }

      case 'SCREENSHOT': {
        context.log(`Capturing step screenshot: ${step.target || 'screenshot'}`);
        const screenshot = await page.screenshot({ fullPage: step.value === 'full' });
        context.addArtifact(
          ArtifactType.SCREENSHOT,
          `screenshot_step_${step.order}_${Date.now()}.png`,
          screenshot,
          'image/png'
        );
        break;
      }

      case 'ASSERT':
      case 'ASSERTION': {
        await this.executeAssertion(step, context);
        break;
      }

      default:
        context.log(`Executing generic action: ${step.action}`);
        break;
    }
  }

  private async executeAssertion(
    step: { target?: string; value?: string; expectedOutput?: string; order: number },
    context: ExecutionContext
  ): Promise<void> {
    const page = this.page;
    if (!page) throw new Error('Page is null');
    const timeout = context.variables['TIMEOUT_MS']
      ? parseInt(context.variables['TIMEOUT_MS'], 10)
      : process.env.NODE_ENV === 'test'
      ? 5000
      : 10000;

    // 1. Assert Title
    if (step.target === 'title' || step.target === 'page.title') {
      const title = await page.title();
      context.log(`Asserting page title: expected '${step.expectedOutput}', got '${title}'`);
      if (step.expectedOutput && !title.includes(step.expectedOutput)) {
        throw new Error(`Title Assertion Failed: expected '${step.expectedOutput}' in '${title}'`);
      }
      return;
    }

    // 2. Assert URL
    if (step.target === 'url' || step.target === 'page.url') {
      const currentUrl = page.url();
      context.log(`Asserting page URL: expected '${step.expectedOutput}', got '${currentUrl}'`);
      if (step.expectedOutput && !currentUrl.includes(step.expectedOutput)) {
        throw new Error(`URL Assertion Failed: expected '${step.expectedOutput}' in '${currentUrl}'`);
      }
      return;
    }

    if (!step.target) throw new Error('ASSERT step requires a target selector');

    // 3. Assert Visibility / Presence
    if (step.value === 'visible' || (!step.value && !step.expectedOutput)) {
      context.log(`Asserting element is visible: ${step.target}`);
      const locator = page.locator(step.target);
      await locator.waitFor({ state: 'visible', timeout });
      return;
    }

    if (step.value === 'hidden') {
      context.log(`Asserting element is hidden: ${step.target}`);
      const locator = page.locator(step.target);
      await locator.waitFor({ state: 'hidden', timeout });
      return;
    }

    // 4. Assert Text Content
    const element = await page.waitForSelector(step.target, { timeout });
    if (!element) throw new Error(`Selector '${step.target}' not found`);

    if (step.expectedOutput) {
      const text = await element.innerText();
      context.log(`Asserting text in '${step.target}': expected '${step.expectedOutput}', got '${text}'`);
      if (!text.includes(step.expectedOutput)) {
        throw new Error(`Text Assertion Failed on '${step.target}': expected '${step.expectedOutput}' but got '${text}'`);
      }
    }
  }

  async cleanup(): Promise<void> {
    try {
      // 1. Stop tracing and extract trace artifact
      if (this.browserContext) {
        try {
          await this.browserContext.tracing.stop({ path: this.traceFilePath });
          const traceBuffer = await fs.readFile(this.traceFilePath);
          if (this.currentContext && traceBuffer.length > 0) {
            this.currentContext.addArtifact(
              ArtifactType.EXECUTION_TRACE,
              path.basename(this.traceFilePath),
              traceBuffer,
              'application/zip'
            );
          }
        } catch (traceErr: any) {
          log.warn({ err: traceErr.message }, 'Failed to finalize trace recording');
        }
      }

      // 2. Extract recorded video
      let videoPath: string | null = null;
      if (this.page) {
        try {
          const video = this.page.video();
          if (video) {
            videoPath = await video.path();
          }
        } catch {}
      }

      // 3. Close page and context to complete video write
      if (this.page) await this.page.close().catch(() => {});
      if (this.browserContext) await this.browserContext.close().catch(() => {});

      if (videoPath && this.currentContext) {
        try {
          const videoBuffer = await fs.readFile(videoPath);
          if (videoBuffer.length > 0) {
            this.currentContext.addArtifact(
              ArtifactType.VIDEO,
              path.basename(videoPath),
              videoBuffer,
              'video/webm'
            );
          }
        } catch (videoErr: any) {
          log.warn({ err: videoErr.message }, 'Failed to read recorded video');
        }
      }

      if (this.browser) await this.browser.close().catch(() => {});
    } catch (cleanupErr: any) {
      log.warn({ err: cleanupErr.message }, 'Error during Playwright cleanup');
    } finally {
      this.page = null;
      this.browserContext = null;
      this.browser = null;
      this.currentContext = null;
    }
  }
}
