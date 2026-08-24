import { describe, it, expect, beforeAll } from 'vitest';
import { cliRunner, runCli } from './index.js';
import { prisma } from '@novaqa/database';
import * as fs from 'fs';
import * as path from 'path';

describe('Testing Platform CLI (@novaqa/cli / testing-platform)', () => {
  beforeAll(async () => {
    const defaultOrg = (await prisma.organization.findFirst()) ||
      (await prisma.organization.create({ data: { name: 'CLI Test Org', slug: `cli-org-${Date.now()}` } }));

    await prisma.project.create({
      data: {
        organizationId: defaultOrg.id,
        name: 'CLI Demo Project',
        slug: `cli-demo-${Date.now()}`,
        baseUrl: 'http://localhost:3000',
        environments: { create: { name: 'Local Env', slug: 'local', baseUrl: 'http://localhost:3000', isDefault: true } },
        testSuites: {
          create: {
            name: 'Default Test Suite',
            testCases: {
              create: [
                { title: 'CLI Verification Step 1', expectedResult: 'Passed' }
              ]
            }
          }
        }
      }
    });
  });

  it('1. testing-platform project init should create .novaqa.json', async () => {
    const res = await cliRunner.projectInit();
    expect(res.success).toBe(true);
    expect(res.config.projectId).toBeDefined();

    const configPath = path.resolve(process.cwd(), '.novaqa.json');
    expect(fs.existsSync(configPath)).toBe(true);

    // Clean up temporary config file
    try {
      fs.unlinkSync(configPath);
    } catch {}
  });

  it('2. testing-platform discover should return discovered routes & endpoints', async () => {
    const res = await cliRunner.discover();
    expect(res.routesDiscovered).toBeGreaterThan(0);
    expect(res.apiEndpointsDiscovered).toBeGreaterThan(0);
    expect(res.coverageEstimate).toBeGreaterThan(90);
  });

  it('3. testing-platform test should execute default suite and exit with code 0', async () => {
    const res = await cliRunner.test();
    expect(res.ciStatus).toBe('PASS');
    expect(res.exitCode).toBe(0);
    expect(res.totalTests).toBeGreaterThan(0);
  });

  it('4. testing-platform test --suite regression should execute regression suite', async () => {
    const res = await cliRunner.test({ suite: 'regression' });
    expect(res.ciStatus).toBe('PASS');
    expect(res.exitCode).toBe(0);
  });

  it('5. testing-platform test --security should run defensive SAST scan', async () => {
    const res = await cliRunner.test({ security: true });
    expect(res.totalTests).toBeGreaterThan(0);
    expect(res.exitCode).toBe(0);
  });

  it('6. testing-platform report should generate and return executive report', async () => {
    const res = await cliRunner.report({ format: 'HTML' as any });
    expect(res.reportId).toBeDefined();
    expect(res.content).toContain('<!DOCTYPE html>');
  });

  it('7. runCli() programmatic parser should handle commands seamlessly', async () => {
    const helpExit = await runCli(['--help']);
    expect(helpExit).toBe(0);

    const discoverExit = await runCli(['discover']);
    expect(discoverExit).toBe(0);

    const testExit = await runCli(['test', '--suite', 'regression']);
    expect(testExit).toBe(0);
  });
});
