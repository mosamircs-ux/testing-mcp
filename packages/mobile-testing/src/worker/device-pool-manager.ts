import {
  IMobileDriver,
  MobileDriverOptions
} from '../types.js';
import { SandboxMobileDriver } from '../drivers/sandbox-mobile-driver.js';
import { AndroidAdbDriver } from '../drivers/android-adb-driver.js';
import { IosSimulatorDriver } from '../drivers/ios-simulator-driver.js';
import {
  MobilePlatform,
  MobileFramework,
  MobileDeviceType,
  MobileDeviceState,
  MobileDeviceInfo,
  MobileNetworkState,
  MobileActionType
} from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';
import { EventEmitter } from 'events';

const log = createChildLogger('mobile-worker');

export class MobileExecutionWorker extends EventEmitter {
  public readonly workerId: string;
  public readonly driver: IMobileDriver;
  public status: 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE' = 'IDLE';
  public lastHeartbeat: Date = new Date();
  public currentRunId?: string;

  constructor(workerId: string, driver: IMobileDriver) {
    super();
    this.workerId = workerId;
    this.driver = driver;
  }

  get device(): MobileDeviceInfo {
    return this.driver.device;
  }

  async acquire(runId: string): Promise<void> {
    if (this.status === 'BUSY') {
      throw new Error(`Worker ${this.workerId} (${this.device.name}) is already busy.`);
    }
    this.status = 'BUSY';
    this.currentRunId = runId;
    this.device.state = MobileDeviceState.BUSY;
    this.lastHeartbeat = new Date();
    await this.driver.connect();
    log.info({ workerId: this.workerId, runId, device: this.device.name }, 'Mobile worker acquired');
  }

  async release(): Promise<void> {
    this.status = 'IDLE';
    this.currentRunId = undefined;
    this.device.state = MobileDeviceState.READY;
    this.lastHeartbeat = new Date();
    log.info({ workerId: this.workerId, device: this.device.name }, 'Mobile worker released');
  }

  async executeStep(step: {
    order: number;
    action: MobileActionType | string;
    target?: string;
    value?: string;
    description?: string;
  }): Promise<{ status: 'PASSED' | 'FAILED'; error?: string; logs: string[] }> {
    this.lastHeartbeat = new Date();
    const action = (step.action || '').toUpperCase();
    const target = step.target || '';
    const value = step.value || '';

    try {
      switch (action) {
        case 'LAUNCH_APP':
        case 'NAVIGATE':
          await this.driver.launchApp(target || undefined, value || undefined);
          break;
        case 'RESET_APP':
          await this.driver.resetApp(target || undefined);
          break;
        case 'INSTALL_APP':
          await this.driver.installApp(target || 'app-release.apk');
          break;
        case 'TAP':
        case 'CLICK':
          await this.driver.tap(target);
          break;
        case 'DOUBLE_TAP':
          await this.driver.doubleTap(target);
          break;
        case 'LONG_PRESS':
          await this.driver.longPress(target, value ? parseInt(value, 10) : 1000);
          break;
        case 'SWIPE':
          await this.driver.swipe((value as any) || 'up');
          break;
        case 'SCROLL':
          await this.driver.scroll((value as any) || 'down');
          break;
        case 'TYPE':
        case 'FILL':
          await this.driver.typeText(target, value);
          break;
        case 'CLEAR_TEXT':
          await this.driver.clearText(target);
          break;
        case 'HIDE_KEYBOARD':
          await this.driver.hideKeyboard();
          break;
        case 'PRESS_BACK':
        case 'BACK':
          await this.driver.pressBack();
          break;
        case 'PRESS_HOME':
          await this.driver.pressHome();
          break;
        case 'OPEN_NOTIFICATIONS':
          await this.driver.openNotifications();
          break;
        case 'OPEN_APP_SWITCHER':
          await this.driver.openAppSwitcher();
          break;
        case 'GRANT_PERMISSION':
          await this.driver.grantPermission(value || target);
          break;
        case 'REVOKE_PERMISSION':
          await this.driver.revokePermission(value || target);
          break;
        case 'OPEN_DEEP_LINK':
          await this.driver.openDeepLink(target || value);
          break;
        case 'SEND_PUSH_NOTIFICATION':
          await this.driver.sendPushNotification({
            title: target || 'Test Notification',
            body: value || 'Notification payload body'
          });
          break;
        case 'SET_NETWORK_STATE':
          await this.driver.setNetworkState(value || MobileNetworkState.WIFI);
          break;
        case 'ASSERT':
        case 'ASSERT_ELEMENT_VISIBLE': {
          const el = await this.driver.findElement(target);
          if (!el || !el.isDisplayed) {
            throw new Error(`Mobile element assertion failed: '${target}' is not visible on screen.`);
          }
          break;
        }
        default:
          await this.driver.tap(target);
          break;
      }

      const logs = await this.driver.getDeviceLogs();
      return { status: 'PASSED', logs };
    } catch (err: any) {
      log.error({ action, target, err: err.message }, 'Step execution error on mobile worker');
      const logs = await this.driver.getDeviceLogs();
      return { status: 'FAILED', error: err.message, logs };
    }
  }
}

export class MobileDevicePoolManager {
  private workers: Map<string, MobileExecutionWorker> = new Map();

  constructor() {
    this.initializeDefaultPool();
  }

  private initializeDefaultPool() {
    // 1. Android Pixel 8 Emulator Worker
    const androidDriver = new AndroidAdbDriver({
      platform: MobilePlatform.ANDROID,
      deviceType: MobileDeviceType.EMULATOR,
      deviceId: 'emulator-5554'
    });
    this.workers.set('worker-android-pixel8', new MobileExecutionWorker('worker-android-pixel8', androidDriver));

    // 2. iOS iPhone 15 Pro Simulator Worker
    const iosDriver = new IosSimulatorDriver({
      platform: MobilePlatform.IOS,
      deviceType: MobileDeviceType.SIMULATOR,
      deviceId: 'simulator-iphone15pro'
    });
    this.workers.set('worker-ios-iphone15', new MobileExecutionWorker('worker-ios-iphone15', iosDriver));

    // 3. React Native / Flutter Cross-Platform Sandbox Worker
    const sandboxDriver = new SandboxMobileDriver({
      platform: MobilePlatform.ANDROID,
      framework: MobileFramework.REACT_NATIVE,
      deviceType: MobileDeviceType.EMULATOR,
      deviceId: 'emulator-react-native-harness'
    });
    this.workers.set('worker-rn-sandbox', new MobileExecutionWorker('worker-rn-sandbox', sandboxDriver));
  }

  async acquireWorker(options?: {
    platform?: MobilePlatform | 'android' | 'ios';
    framework?: MobileFramework | string;
    deviceType?: MobileDeviceType | string;
    runId?: string;
  }): Promise<MobileExecutionWorker> {
    const targetPlatform = options?.platform === 'ios' || options?.platform === MobilePlatform.IOS
      ? MobilePlatform.IOS
      : MobilePlatform.ANDROID;

    for (const worker of this.workers.values()) {
      if (worker.status === 'IDLE' && worker.device.platform === targetPlatform) {
        await worker.acquire(options?.runId || 'run-default');
        return worker;
      }
    }

    // Provision on-demand dynamic worker if pool is saturated
    const dynamicDriver = targetPlatform === MobilePlatform.IOS
      ? new IosSimulatorDriver({ platform: MobilePlatform.IOS })
      : new AndroidAdbDriver({ platform: MobilePlatform.ANDROID });

    const workerId = `worker-${targetPlatform.toLowerCase()}-${Date.now().toString(36)}`;
    const dynamicWorker = new MobileExecutionWorker(workerId, dynamicDriver);
    this.workers.set(workerId, dynamicWorker);
    await dynamicWorker.acquire(options?.runId || 'run-default');

    return dynamicWorker;
  }

  async releaseWorker(worker: MobileExecutionWorker): Promise<void> {
    await worker.release();
  }

  listAvailableDevices(): MobileDeviceInfo[] {
    return Array.from(this.workers.values()).map((w) => w.device);
  }

  getPoolStats() {
    let idle = 0;
    let busy = 0;
    let offline = 0;

    for (const worker of this.workers.values()) {
      if (worker.status === 'IDLE') idle++;
      else if (worker.status === 'BUSY') busy++;
      else offline++;
    }

    return {
      total: this.workers.size,
      available: idle,
      busy,
      offline
    };
  }
}

export const mobileDevicePool = new MobileDevicePoolManager();
