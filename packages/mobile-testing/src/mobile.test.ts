import { describe, it, expect } from 'vitest';
import {
  SandboxMobileDriver,
  AndroidAdbDriver,
  IosSimulatorDriver,
  MobileDevicePoolManager,
  mobileDevicePool,
  MobileTestEngine
} from './index.js';
import {
  MobilePlatform,
  MobileFramework,
  MobileDeviceType,
  MobileDeviceState,
  MobileNetworkState,
  MobileActionType
} from '@novaqa/types';
import { ExecutionContext } from '@novaqa/testing';
import { mobileScenarioGenerator } from '@novaqa/ai';

describe('Mobile Testing Support — End-to-End Suite', () => {
  describe('1. Sandbox Mobile Driver Gestures & System Capabilities', () => {
    it('should connect, launch app, execute gestures, and manipulate permissions', async () => {
      const driver = new SandboxMobileDriver({
        platform: MobilePlatform.ANDROID,
        framework: MobileFramework.REACT_NATIVE,
        appPackage: 'com.novaqa.store'
      });

      await driver.connect();
      expect(driver.device.state).toBe(MobileDeviceState.READY);

      // App lifecycle
      await driver.installApp('/builds/app-release.apk');
      await driver.launchApp('com.novaqa.store', 'MainActivity');
      expect(driver.device.currentApp).toBe('com.novaqa.store');

      // Gestures
      await driver.tap('input_email');
      await driver.typeText('input_email', 'mobile.qa@novaqa.com');
      await driver.tap('input_password');
      await driver.typeText('input_password', 'Password123!');
      await driver.hideKeyboard();
      await driver.tap('btn_login');
      await driver.doubleTap('header_title');
      await driver.longPress('btn_login', 500);
      await driver.swipe('left');
      await driver.scroll('down');

      // Hardware controls
      await driver.pressBack();
      await driver.pressHome();
      await driver.openNotifications();
      await driver.openAppSwitcher();

      // Permissions
      await driver.grantPermission('ACCESS_FINE_LOCATION');
      await driver.grantPermission('CAMERA');
      await driver.revokePermission('CAMERA');

      // Deep Links & Push Notifications
      await driver.openDeepLink('novaqa://products/item-992?ref=banner');
      await driver.sendPushNotification({
        title: 'Order Shipped',
        body: 'Your item is out for delivery'
      });

      // Network State Throttling
      await driver.setNetworkState(MobileNetworkState.OFFLINE);
      expect(driver.device.networkState).toBe(MobileNetworkState.OFFLINE);
      await driver.setNetworkState(MobileNetworkState.WIFI);
      expect(driver.device.networkState).toBe(MobileNetworkState.WIFI);

      // Screenshots & Recording
      const screenshot = await driver.captureScreenshot();
      expect(screenshot).toBeInstanceOf(Buffer);
      expect(screenshot.length).toBeGreaterThan(0);

      await driver.startRecording();
      const video = await driver.stopRecording();
      expect(video).toBeInstanceOf(Buffer);

      // Logs & Crashes
      const logs = await driver.getDeviceLogs();
      expect(logs.length).toBeGreaterThan(10);
      expect(logs.some((l) => l.includes('MotionEvent'))).toBe(true);

      const crashes = await driver.detectCrashes();
      expect(Array.isArray(crashes)).toBe(true);

      await driver.disconnect();
      expect(driver.device.state).toBe(MobileDeviceState.OFFLINE);
    });

    it('should verify AndroidAdbDriver and IosSimulatorDriver specialized drivers', async () => {
      const android = new AndroidAdbDriver({ platform: MobilePlatform.ANDROID });
      await android.connect();
      await android.grantPermission('RECORD_AUDIO', 'com.novaqa.store');
      await android.openDeepLink('novaqa://account/settings');
      expect(android.device.platform).toBe(MobilePlatform.ANDROID);
      await android.disconnect();

      const ios = new IosSimulatorDriver({ platform: MobilePlatform.IOS });
      await ios.connect();
      await ios.grantPermission('camera', 'com.novaqa.store');
      await ios.openDeepLink('novaqa://cart');
      expect(ios.device.platform).toBe(MobilePlatform.IOS);
      await ios.disconnect();
    });
  });

  describe('2. Mobile Execution Worker & Device Pool Manager', () => {
    it('should manage device worker lifecycle and enforce concurrency locks', async () => {
      const pool = new MobileDevicePoolManager();
      const statsInitial = pool.getPoolStats();
      expect(statsInitial.total).toBeGreaterThanOrEqual(3);
      expect(statsInitial.available).toBeGreaterThanOrEqual(3);

      // Acquire Android worker
      const worker1 = await pool.acquireWorker({
        platform: MobilePlatform.ANDROID,
        runId: 'run-test-01'
      });
      expect(worker1.status).toBe('BUSY');
      expect(worker1.device.platform).toBe(MobilePlatform.ANDROID);

      // Acquire iOS worker
      const worker2 = await pool.acquireWorker({
        platform: MobilePlatform.IOS,
        runId: 'run-test-02'
      });
      expect(worker2.status).toBe('BUSY');
      expect(worker2.device.platform).toBe(MobilePlatform.IOS);

      // Execute steps on worker
      const step1 = await worker1.executeStep({
        order: 1,
        action: MobileActionType.LAUNCH_APP,
        target: 'com.novaqa.store',
        description: 'Launch app'
      });
      expect(step1.status).toBe('PASSED');

      const step2 = await worker1.executeStep({
        order: 2,
        action: MobileActionType.TAP,
        target: 'input_email',
        description: 'Tap email field'
      });
      expect(step2.status).toBe('PASSED');

      // Release workers
      await pool.releaseWorker(worker1);
      await pool.releaseWorker(worker2);

      const statsFinal = pool.getPoolStats();
      expect(statsFinal.busy).toBe(0);
      expect(statsFinal.available).toBe(statsFinal.total);
    });
  });

  describe('3. MobileTestEngine Execution & Telemetry Integration', () => {
    it('should execute mobile test case through MobileTestEngine in sandbox context', async () => {
      const engine = new MobileTestEngine({ platform: MobilePlatform.ANDROID });
      const context = new ExecutionContext('run-mobile-integration', 'http://localhost:3000');

      const telemetryEvents: string[] = [];
      context.on('telemetry', (e) => {
        telemetryEvents.push(e.type);
      });

      await engine.initialize(context);

      const testCase = {
        id: 'tc-mob-01',
        suiteId: 'suite-01',
        title: 'Verify Mobile Checkout Flow',
        expectedResult: 'Passed',
        steps: [
          { order: 1, action: 'LAUNCH_APP', target: 'com.novaqa.store', description: 'Launch App' },
          { order: 2, action: 'TAP', target: 'input_email', description: 'Focus Email' },
          { order: 3, action: 'TYPE', target: 'input_email', value: 'user@novaqa.com', description: 'Type Email' },
          { order: 4, action: 'GRANT_PERMISSION', target: 'ACCESS_FINE_LOCATION', description: 'Grant Location' },
          { order: 5, action: 'OPEN_DEEP_LINK', target: 'novaqa://products/checkout', description: 'Deep Link' },
          { order: 6, action: 'ASSERT_ELEMENT_VISIBLE', target: 'header_title', description: 'Assert Header' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await engine.executeTestCase(testCase as any, context);
      expect(result.status).toBe('PASSED');
      expect(result.stepResults.length).toBe(6);
      expect(result.stepResults.every((s) => s.status === 'PASSED')).toBe(true);

      // Verify artifact creation (device logs)
      expect(context.artifacts.length).toBeGreaterThan(0);
      expect(context.artifacts[0].type).toBe('LOG');

      // Verify telemetry events emitted
      expect(telemetryEvents).toContain('TEST_STARTED');
      expect(telemetryEvents).toContain('STEP_STARTED');
      expect(telemetryEvents).toContain('STEP_COMPLETED');
      expect(telemetryEvents).toContain('TEST_COMPLETED');

      await engine.cleanup();
    });
  });

  describe('4. Autonomous Mobile Scenario Generator', () => {
    it('should generate full suite of mobile test scenarios across all 11 categories', async () => {
      const scenarios = await mobileScenarioGenerator.generateScenarios({
        appName: 'NovaQA Mobile Store',
        framework: MobileFramework.REACT_NATIVE,
        platform: MobilePlatform.ANDROID,
        appPackageOrBundle: 'com.novaqa.store',
        deepLinkScheme: 'novaqa'
      });

      expect(scenarios.length).toBeGreaterThanOrEqual(11);

      const titles = scenarios.map((s) => s.title);
      expect(titles.some((t) => t.includes('Login'))).toBe(true);
      expect(titles.some((t) => t.includes('Registration'))).toBe(true);
      expect(titles.some((t) => t.includes('Onboarding'))).toBe(true);
      expect(titles.some((t) => t.includes('Push Notification'))).toBe(true);
      expect(titles.some((t) => t.includes('Deep Link'))).toBe(true);
      expect(titles.some((t) => t.includes('Offline Mode'))).toBe(true);
      expect(titles.some((t) => t.includes('Form Validation'))).toBe(true);
      expect(titles.some((t) => t.includes('Back Button'))).toBe(true);
      expect(titles.some((t) => t.includes('Session Expiration'))).toBe(true);
      expect(titles.some((t) => t.includes('Payment'))).toBe(true);
      expect(titles.some((t) => t.includes('Logout'))).toBe(true);

      // Verify structure of steps
      const loginScenario = scenarios.find((s) => s.scenarioId === 'mob-01-login')!;
      expect(loginScenario.steps.length).toBeGreaterThan(3);
      expect(loginScenario.steps[0].action).toBe(MobileActionType.LAUNCH_APP);
    });
  });
});
