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

export interface MobileDriverOptions {
  platform: MobilePlatform | 'android' | 'ios';
  framework?: MobileFramework | string;
  deviceType?: MobileDeviceType | string;
  deviceId?: string;
  appPackage?: string;
  appActivity?: string;
  bundleId?: string;
  appPath?: string;
  deepLinkScheme?: string;
}

export interface TouchPoint {
  x: number;
  y: number;
}

export interface SwipeOptions {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs?: number;
}

export interface MobileElementInfo {
  id: string;
  accessibilityId?: string;
  text?: string;
  className?: string;
  bounds: { x: number; y: number; width: number; height: number };
  isDisplayed: boolean;
  isEnabled: boolean;
  isSelected?: boolean;
}

export interface IMobileDriver {
  readonly platform: MobilePlatform;
  readonly device: MobileDeviceInfo;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Lifecycle
  installApp(appPath: string): Promise<void>;
  uninstallApp(bundleOrPackage: string): Promise<void>;
  launchApp(bundleOrPackage?: string, activity?: string): Promise<void>;
  resetApp(bundleOrPackage?: string): Promise<void>;
  terminateApp(bundleOrPackage?: string): Promise<void>;

  // Gestures & Input
  tap(locator: MobileLocator | string): Promise<void>;
  doubleTap(locator: MobileLocator | string): Promise<void>;
  longPress(locator: MobileLocator | string, durationMs?: number): Promise<void>;
  swipe(options: SwipeOptions | 'up' | 'down' | 'left' | 'right'): Promise<void>;
  scroll(direction: 'up' | 'down', distanceRatio?: number): Promise<void>;
  typeText(locator: MobileLocator | string, text: string): Promise<void>;
  clearText(locator: MobileLocator | string): Promise<void>;
  hideKeyboard(): Promise<void>;

  // System Hardware Controls
  pressBack(): Promise<void>;
  pressHome(): Promise<void>;
  openNotifications(): Promise<void>;
  openAppSwitcher(): Promise<void>;

  // Permissions & OS Integration
  grantPermission(permission: string, bundleOrPackage?: string): Promise<void>;
  revokePermission(permission: string, bundleOrPackage?: string): Promise<void>;
  openDeepLink(url: string): Promise<void>;
  sendPushNotification(payload: { title: string; body: string; data?: Record<string, any> }): Promise<void>;

  // Network & Environment
  setNetworkState(state: MobileNetworkState | string): Promise<void>;

  // Telemetry & Diagnostics
  captureScreenshot(): Promise<Buffer>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<Buffer>;
  getDeviceLogs(): Promise<string[]>;
  detectCrashes(): Promise<MobileCrashReport[]>;
  findElement(locator: MobileLocator | string): Promise<MobileElementInfo | null>;
}
