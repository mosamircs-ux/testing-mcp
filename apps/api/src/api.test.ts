import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from './server.js';
import { Server } from 'http';

describe('API Service Endpoints', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createServer();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('GET /health should return 200 OK', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe('ok');
    expect(data.service).toBe('novaqa-api');
  });

  it('GET /health/live should return alive status', async () => {
    const res = await fetch(`${baseUrl}/health/live`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe('alive');
  });
});
