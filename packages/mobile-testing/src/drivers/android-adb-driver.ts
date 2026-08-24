import { SandboxMobileDriver } from './sandbox-mobile-driver.js';
import { MobileDriverOptions } from '../types.js';
import { MobilePlatform, MobileDeviceType } from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const log = createChildLogger('android-adb-driver');

export class AndroidAdbDriver extends SandboxMobileDriver {
  private adbAvailable = false;

  constructor(options: MobileDriverOptions = { platform: MobilePlatform.ANDROID }) {
    super({
      ...options,
      platform: MobilePlatform.ANDROID,
      deviceType: options.deviceType || MobileDeviceType.EMULATOR
    });
  }

  override async connect(): Promise<void> {
    try {
      const { stdout } = await execAsync('adb devices');
      if (stdout.includes('List of devices')) {
        this.adbAvailable = true;
        log.info({ stdout }, 'ADB daemon detected on host');
      }
    } catch {
      this.adbAvailable = false;
      log.info('Running in isolated Sandbox ADB Emulator emulation mode');
    }

    await super.connect();
  }

  override async tap(locator: any): Promise<void> {
    if (this.adbAvailable && locator?.coordinates) {
      try {
        await execAsync(`adb shell input tap ${locator.coordinates.x} ${locator.coordinates.y}`);
      } catch {}
    }
    await super.tap(locator);
  }

  override async openDeepLink(url: string): Promise<void> {
    if (this.adbAvailable) {
      try {
        await execAsync(`adb shell am start -a android.intent.action.VIEW -d "${url}"`);
      } catch {}
    }
    await super.openDeepLink(url);
  }

  override async grantPermission(permission: string, pkg?: string): Promise<void> {
    if (this.adbAvailable && pkg) {
      try {
        await execAsync(`adb shell pm grant ${pkg} android.permission.${permission}`);
      } catch {}
    }
    await super.grantPermission(permission, pkg);
  }
}
