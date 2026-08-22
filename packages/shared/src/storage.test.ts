import { describe, it, expect } from 'vitest';
import { LocalStorageProvider } from './storage.js';
import path from 'path';
import fs from 'fs/promises';

describe('Storage Service', () => {
  const testStorageDir = './data/test-artifacts';
  const storage = new LocalStorageProvider(testStorageDir);

  it('should upload, check existence, download, and delete files', async () => {
    const key = 'test-run/screen_1.png';
    const content = Buffer.from('fake-png-binary-stream-12345');

    const uploadedKey = await storage.upload(content, {
      key,
      contentType: 'image/png'
    });

    expect(uploadedKey).toBe(key);
    expect(await storage.exists(key)).toBe(true);

    const downloaded = await storage.download(key);
    expect(downloaded.toString()).toBe(content.toString());

    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);

    // Cleanup test folder
    try {
      await fs.rm(path.resolve(testStorageDir), { recursive: true, force: true });
    } catch {}
  });
});
