import fs from 'fs/promises';
import path from 'path';
import { loadConfig } from './config';
import { createChildLogger } from './logger';

const log = createChildLogger('storage');
const config = loadConfig();

export interface StorageUploadOptions {
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageProvider {
  upload(buffer: Buffer | string, options: StorageUploadOptions): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor(basePath: string = config.STORAGE_LOCAL_PATH) {
    this.basePath = path.resolve(basePath);
    this.init();
  }

  private async init() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (err) {
      log.error({ err }, 'Failed to initialize local storage folder');
    }
  }

  async upload(buffer: Buffer | string, options: StorageUploadOptions): Promise<string> {
    const filePath = path.join(this.basePath, options.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const data = typeof buffer === 'string' ? Buffer.from(buffer, 'utf-8') : buffer;
    await fs.writeFile(filePath, data);
    return options.key;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);
    return await fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  getPublicUrl(key: string): string {
    return `${config.API_URL}/api/v1/artifacts/${encodeURIComponent(key)}/download`;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.bucket = config.S3_BUCKET_NAME;
    this.endpoint = config.S3_ENDPOINT;
  }

  async upload(buffer: Buffer | string, options: StorageUploadOptions): Promise<string> {
    log.info({ key: options.key, bucket: this.bucket }, 'S3 Upload simulation / dispatch');
    return options.key;
  }

  async download(key: string): Promise<Buffer> {
    log.info({ key, bucket: this.bucket }, 'S3 Download simulation / dispatch');
    return Buffer.from('');
  }

  async delete(key: string): Promise<void> {
    log.info({ key, bucket: this.bucket }, 'S3 Delete simulation / dispatch');
  }

  getPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    return true;
  }
}

export function getStorageProvider(): StorageProvider {
  if (config.STORAGE_PROVIDER === 's3') {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}

export const storage = getStorageProvider();
