import { SandboxMobileDriver } from './sandbox-mobile-driver.js';
import { MobileDriverOptions } from '../types.js';
import { MobilePlatform, MobileDeviceType } from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const log = createChildLogger('ios-simulator-driver');

export class IosSimulatorDriver extends SandboxMobileDriver {
  private simctlAvailable = false;

  constructor(options: MobileDriverOptions = { platform: MobilePlatform.IOS }) {
    super({
      ...options,
      platform: MobilePlatform.IOS,
      deviceType: options.deviceType || MobileDeviceType.SIMULATOR
    });
  }

  override async connect(): Promise<void> {
    try {
      const { stdout } = await execAsync('xcrun simctl list devices');
      if (stdout.includes('iPhone')) {
        this.simctlAvailable = true;
        log.info('iOS xcrun simctl detected on host');
      }
    } catch {
      this.simctlAvailable = false;
      log.info('Running in isolated Sandbox iOS Simulator emulation mode');
    }

    await super.connect();
  }

  override async openDeepLink(url: string): Promise<void> {
    if (this.simctlAvailable) {
      try {
        await execAsync(`xcrun simctl openurl booted "${url}"`);
      } catch {}
    }
    await super.openDeepLink(url);
  }

  override async grantPermission(permission: string, bundleId?: string): Promise<void> {
    if (this.simctlAvailable && bundleId) {
      try {
        await execAsync(`xcrun simctl privacy booted grant ${permission} ${bundleId}`);
      } catch {}
    }
    await super.grantPermission(permission, bundleId);
  }
}
