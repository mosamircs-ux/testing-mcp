import {
  IMobileDriver,
  MobileDriverOptions,
  MobileElementInfo,
  SwipeOptions
} from '../types.js';
import {
  MobilePlatform,
  MobileFramework,
  MobileDeviceType,
  MobileDeviceState,
  MobileDeviceInfo,
  MobileNetworkState,
  MobileLocator,
  MobileCrashReport
} from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('sandbox-mobile-driver');

export class SandboxMobileDriver implements IMobileDriver {
  public readonly platform: MobilePlatform;
  public readonly device: MobileDeviceInfo;
  private appInstalled = false;
  private currentAppPackage: string;
  private logs: string[] = [];
  private crashes: MobileCrashReport[] = [];
  private grantedPermissions = new Set<string>();
  private isRecording = false;
  private recordingFrames: Buffer[] = [];
  private elements: Map<string, MobileElementInfo> = new Map();
  private focusedElementId: string | null = null;
  private networkState: MobileNetworkState = MobileNetworkState.WIFI;

  constructor(options: MobileDriverOptions = { platform: MobilePlatform.ANDROID }) {
    this.platform = options.platform === 'ios' || options.platform === MobilePlatform.IOS
      ? MobilePlatform.IOS
      : MobilePlatform.ANDROID;

    this.currentAppPackage = options.appPackage || options.bundleId || 'com.novaqa.mobileapp';

    this.device = {
      id: options.deviceId || `emulator-${this.platform.toLowerCase()}-${Date.now().toString(36)}`,
      name: this.platform === MobilePlatform.ANDROID ? 'Pixel 8 Pro (API 34)' : 'iPhone 15 Pro (iOS 17.4)',
      platform: this.platform,
      framework: (options.framework as MobileFramework) || MobileFramework.REACT_NATIVE,
      deviceType: (options.deviceType as MobileDeviceType) || MobileDeviceType.EMULATOR,
      osVersion: this.platform === MobilePlatform.ANDROID ? '14.0 (API 34)' : '17.4',
      screenResolution: this.platform === MobilePlatform.ANDROID ? { width: 1080, height: 2400 } : { width: 1179, height: 2556 },
      pixelRatio: 3,
      state: MobileDeviceState.READY,
      currentApp: this.currentAppPackage,
      batteryLevel: 98,
      networkState: MobileNetworkState.WIFI,
      isLocked: false
    };

    this.seedDefaultViewHierarchy();
  }

  private seedDefaultViewHierarchy() {
    // Standard mobile UI screen components
    this.registerElement({
      id: 'header_title',
      accessibilityId: 'header_title',
      text: 'NovaQA Mobile Store',
      className: 'android.widget.TextView',
      bounds: { x: 40, y: 120, width: 1000, height: 80 },
      isDisplayed: true,
      isEnabled: true
    });

    this.registerElement({
      id: 'input_email',
      accessibilityId: 'input_email',
      text: '',
      className: 'android.widget.EditText',
      bounds: { x: 60, y: 300, width: 960, height: 120 },
      isDisplayed: true,
      isEnabled: true
    });

    this.registerElement({
      id: 'input_password',
      accessibilityId: 'input_password',
      text: '',
      className: 'android.widget.EditText',
      bounds: { x: 60, y: 460, width: 960, height: 120 },
      isDisplayed: true,
      isEnabled: true
    });

    this.registerElement({
      id: 'btn_login',
      accessibilityId: 'btn_login',
      text: 'Sign In',
      className: 'android.widget.Button',
      bounds: { x: 60, y: 620, width: 960, height: 140 },
      isDisplayed: true,
      isEnabled: true
    });

    this.registerElement({
      id: 'btn_permission_allow',
      accessibilityId: 'btn_permission_allow',
      text: 'Allow While Using App',
      className: 'android.widget.Button',
      bounds: { x: 100, y: 1800, width: 880, height: 120 },
      isDisplayed: true,
      isEnabled: true
    });
  }

  private registerElement(el: MobileElementInfo) {
    this.elements.set(el.id, el);
    if (el.accessibilityId) this.elements.set(el.accessibilityId, el);
    if (el.text) this.elements.set(el.text, el);
  }

  private logEvent(tag: string, message: string) {
    const entry = `[${new Date().toISOString()}] [${this.platform}] [${tag}] ${message}`;
    this.logs.push(entry);
    log.info({ tag, message, deviceId: this.device.id }, 'Mobile device event');
  }

  async connect(): Promise<void> {
    this.device.state = MobileDeviceState.READY;
    this.logEvent('SYSTEM', `Connected to ${this.device.name} (${this.device.id})`);
  }

  async disconnect(): Promise<void> {
    this.device.state = MobileDeviceState.OFFLINE;
    this.logEvent('SYSTEM', `Disconnected device ${this.device.id}`);
  }

  async installApp(appPath: string): Promise<void> {
    this.logEvent('PM', `Installing application package from: ${appPath}`);
    this.appInstalled = true;
    this.logEvent('PM', `Package ${this.currentAppPackage} installed successfully (versionCode=101)`);
  }

  async uninstallApp(bundleOrPackage: string): Promise<void> {
    this.logEvent('PM', `Uninstalled package ${bundleOrPackage}`);
    this.appInstalled = false;
  }

  async launchApp(bundleOrPackage?: string, activity?: string): Promise<void> {
    const pkg = bundleOrPackage || this.currentAppPackage;
    this.device.currentApp = pkg;
    this.logEvent('AM', `Starting intent { act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] cmp=${pkg}/${activity || 'MainActivity'} }`);
    this.logEvent('ACTIVITY', `Displayed ${pkg}/.MainActivity: +214ms`);
  }

  async resetApp(bundleOrPackage?: string): Promise<void> {
    const pkg = bundleOrPackage || this.currentAppPackage;
    this.logEvent('PM', `Cleared application user data and cache for ${pkg}`);
    this.grantedPermissions.clear();
    await this.launchApp(pkg);
  }

  async terminateApp(bundleOrPackage?: string): Promise<void> {
    const pkg = bundleOrPackage || this.currentAppPackage;
    this.logEvent('AM', `Force stopping package ${pkg}`);
    this.device.currentApp = undefined;
  }

  async tap(locator: MobileLocator | string): Promise<void> {
    const el = await this.findElement(locator);
    const targetName = typeof locator === 'string' ? locator : locator.accessibilityId || locator.id || locator.text || 'screen';
    const x = el ? el.bounds.x + el.bounds.width / 2 : 540;
    const y = el ? el.bounds.y + el.bounds.height / 2 : 1200;

    this.logEvent('INPUT', `MotionEvent { action=ACTION_DOWN/UP, x=${x}, y=${y}, target='${targetName}' }`);
    if (el) {
      this.focusedElementId = el.id;
    }
  }

  async doubleTap(locator: MobileLocator | string): Promise<void> {
    await this.tap(locator);
    await new Promise((r) => setTimeout(r, 80));
    await this.tap(locator);
  }

  async longPress(locator: MobileLocator | string, durationMs = 1000): Promise<void> {
    const targetName = typeof locator === 'string' ? locator : locator.accessibilityId || locator.id || 'target';
    this.logEvent('INPUT', `LongPress gesture on '${targetName}' duration=${durationMs}ms`);
  }

  async swipe(options: SwipeOptions | 'up' | 'down' | 'left' | 'right'): Promise<void> {
    if (typeof options === 'string') {
      const direction = options;
      this.logEvent('GESTURE', `Swipe ${direction} across viewport (${this.device.screenResolution.width}x${this.device.screenResolution.height})`);
    } else {
      this.logEvent('GESTURE', `Swipe from (${options.startX}, ${options.startY}) to (${options.endX}, ${options.endY}) in ${options.durationMs || 300}ms`);
    }
  }

  async scroll(direction: 'up' | 'down', distanceRatio = 0.5): Promise<void> {
    this.logEvent('GESTURE', `Scroll ${direction} distanceRatio=${distanceRatio}`);
  }

  async typeText(locator: MobileLocator | string, text: string): Promise<void> {
    const targetName = typeof locator === 'string' ? locator : locator.accessibilityId || locator.id || 'focused_input';
    this.logEvent('IME', `InputMethodManager: commitText('${text}') to '${targetName}'`);
    const el = await this.findElement(locator);
    if (el) {
      el.text = text;
    }
  }

  async clearText(locator: MobileLocator | string): Promise<void> {
    const el = await this.findElement(locator);
    if (el) el.text = '';
    this.logEvent('IME', `Cleared text on element`);
  }

  async hideKeyboard(): Promise<void> {
    this.logEvent('IME', `hideSoftInputFromWindow() executed`);
  }

  async pressBack(): Promise<void> {
    this.logEvent('KEYEVENT', `KEYCODE_BACK dispatched to current Activity`);
  }

  async pressHome(): Promise<void> {
    this.logEvent('KEYEVENT', `KEYCODE_HOME dispatched, app moved to background`);
  }

  async openNotifications(): Promise<void> {
    this.logEvent('SYSTEM', `Status bar expanded: notifications panel opened`);
  }

  async openAppSwitcher(): Promise<void> {
    this.logEvent('SYSTEM', `KEYCODE_APP_SWITCH: Overview screen rendered`);
  }

  async grantPermission(permission: string, bundleOrPackage?: string): Promise<void> {
    const pkg = bundleOrPackage || this.currentAppPackage;
    this.grantedPermissions.add(permission);
    this.logEvent('PM', `Permission '${permission}' GRANTED to ${pkg}`);
  }

  async revokePermission(permission: string, bundleOrPackage?: string): Promise<void> {
    const pkg = bundleOrPackage || this.currentAppPackage;
    this.grantedPermissions.delete(permission);
    this.logEvent('PM', `Permission '${permission}' REVOKED for ${pkg}`);
  }

  async openDeepLink(url: string): Promise<void> {
    this.logEvent('AM', `Starting deep-link activity with URI: ${url}`);
    this.logEvent('INTENT', `Broadcast intent action=android.intent.action.VIEW data=${url}`);
  }

  async sendPushNotification(payload: { title: string; body: string; data?: Record<string, any> }): Promise<void> {
    this.logEvent('FCM', `Received Push Notification: "${payload.title}" - ${payload.body} (data=${JSON.stringify(payload.data || {})})`);
  }

  async setNetworkState(state: MobileNetworkState | string): Promise<void> {
    this.networkState = state as MobileNetworkState;
    this.device.networkState = this.networkState;
    this.logEvent('CONNECTIVITY', `Network connection state changed to: ${state}`);
  }

  async captureScreenshot(): Promise<Buffer> {
    // Generate valid 1x1 PNG buffer with metadata header
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return Buffer.from(pngBase64, 'base64');
  }

  async startRecording(): Promise<void> {
    this.isRecording = true;
    this.recordingFrames = [];
    this.logEvent('MEDIA', `Screen recording started at 60fps, 1080p`);
  }

  async stopRecording(): Promise<Buffer> {
    this.isRecording = false;
    this.logEvent('MEDIA', `Screen recording stopped. Encoded MP4 video.`);
    return Buffer.from('FAKE_MP4_VIDEO_HEADER_AND_STREAM');
  }

  async getDeviceLogs(): Promise<string[]> {
    return [...this.logs];
  }

  async detectCrashes(): Promise<MobileCrashReport[]> {
    return [...this.crashes];
  }

  async findElement(locator: MobileLocator | string): Promise<MobileElementInfo | null> {
    const query = typeof locator === 'string' ? locator : locator.accessibilityId || locator.id || locator.text || '';
    if (this.elements.has(query)) {
      return this.elements.get(query)!;
    }

    for (const el of this.elements.values()) {
      if (el.accessibilityId?.includes(query) || el.text?.includes(query) || el.id.includes(query)) {
        return el;
      }
    }

    return {
      id: `element-${Date.now()}`,
      accessibilityId: query,
      text: query,
      bounds: { x: 100, y: 400, width: 880, height: 100 },
      isDisplayed: true,
      isEnabled: true
    };
  }
}
