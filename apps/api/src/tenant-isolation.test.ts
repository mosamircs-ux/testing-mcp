import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from './server';
import { prisma } from '@novaqa/database';
import { TokenService } from '@novaqa/auth';
import { Role } from '@novaqa/types';

describe('SaaS Authentication & Tenant Isolation Security Tests', () => {
  const app = createServer();

  let acmeOwnerToken: string;
  let acmeQaToken: string;
  let acmeDevToken: string;
  let acmeViewerToken: string;
  let acmeBillingToken: string;
  let globexOwnerToken: string;

  let acmeOrgId: string;
  let globexOrgId: string;
  let acmeProjectId: string;
  let globexProjectId: string;

  beforeAll(async () => {
    // 1. Fetch seeded organizations
    const acmeOrg = await prisma.organization.findUnique({ where: { slug: 'acme-corp' } });
    const globexOrg = await prisma.organization.findUnique({ where: { slug: 'globex-industries' } });

    expect(acmeOrg).toBeDefined();
    expect(globexOrg).toBeDefined();

    acmeOrgId = acmeOrg!.id;
    globexOrgId = globexOrg!.id;

    // 2. Fetch seeded projects
    const acmeProject = await prisma.project.findFirst({ where: { organizationId: acmeOrgId } });
    const globexProject = await prisma.project.findFirst({ where: { organizationId: globexOrgId } });

    expect(acmeProject).toBeDefined();
    expect(globexProject).toBeDefined();

    acmeProjectId = acmeProject!.id;
    globexProjectId = globexProject!.id;

    // 3. Fetch users and create tokens
    const alice = await prisma.user.findUnique({ where: { email: 'alice@acme.com' } });
    const bob = await prisma.user.findUnique({ where: { email: 'bob@acme.com' } });
    const charlie = await prisma.user.findUnique({ where: { email: 'charlie@acme.com' } });
    const david = await prisma.user.findUnique({ where: { email: 'david@acme.com' } });
    const grace = await prisma.user.findUnique({ where: { email: 'grace@acme.com' } });
    const eve = await prisma.user.findUnique({ where: { email: 'eve@globex.com' } });

    acmeOwnerToken = TokenService.signAccessToken({
      userId: alice!.id,
      email: alice!.email,
      organizationId: acmeOrgId,
      role: Role.OWNER
    });

    acmeQaToken = TokenService.signAccessToken({
      userId: bob!.id,
      email: bob!.email,
      organizationId: acmeOrgId,
      role: Role.QA_ENGINEER
    });

    acmeDevToken = TokenService.signAccessToken({
      userId: charlie!.id,
      email: charlie!.email,
      organizationId: acmeOrgId,
      role: Role.DEVELOPER
    });

    acmeViewerToken = TokenService.signAccessToken({
      userId: david!.id,
      email: david!.email,
      organizationId: acmeOrgId,
      role: Role.VIEWER
    });

    acmeBillingToken = TokenService.signAccessToken({
      userId: grace!.id,
      email: grace!.email,
      organizationId: acmeOrgId,
      role: Role.BILLING_MANAGER
    });

    globexOwnerToken = TokenService.signAccessToken({
      userId: eve!.id,
      email: eve!.email,
      organizationId: globexOrgId,
      role: Role.OWNER
    });
  });

  describe('1. Authentication Lifecycle & Session Rotation', () => {
    it('should register a new user, create an organization, and return auth tokens', async () => {
      const testEmail = `newuser_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New Founder',
          email: testEmail,
          password: 'SuperSecret123!',
          organizationName: 'Founder AI Tech'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.verificationToken).toBeDefined();
      expect(res.body.data.organization.role).toBe('OWNER');
    });

    it('should authenticate existing user and create a new session', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@acme.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should rotate session when refreshing token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@acme.com',
          password: 'Password123!'
        });

      const initialRefreshToken = loginRes.body.data.tokens.refreshToken;

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.tokens.accessToken).toBeDefined();
      expect(refreshRes.body.data.tokens.refreshToken).toBeDefined();
      expect(refreshRes.body.data.tokens.refreshToken).not.toBe(initialRefreshToken);

      // Old refresh token must now be invalid
      const reuseAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(reuseAttempt.status).toBe(401);
    });

    it('should complete password reset lifecycle', async () => {
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'bob@acme.com' });

      expect(forgotRes.status).toBe(200);
      const resetToken = forgotRes.body.resetToken;
      expect(resetToken).toBeDefined();

      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'BrandNewPassword123!'
        });

      expect(resetRes.status).toBe(200);

      // Verify login with new password
      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bob@acme.com',
          password: 'BrandNewPassword123!'
        });

      expect(newLogin.status).toBe(200);
    });
  });

  describe('2. Multi-Tenant Data Isolation (Org A vs Org B)', () => {
    it('Acme user should only receive Acme projects in list endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${acmeOwnerToken}`);

      expect(res.status).toBe(200);
      const projects = res.body.data;
      expect(projects.length).toBeGreaterThan(0);

      // All returned projects MUST belong to Acme
      for (const p of projects) {
        expect(p.organizationId).toBe(acmeOrgId);
        expect(p.id).not.toBe(globexProjectId);
      }
    });

    it('Globex user should only receive Globex projects in list endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${globexOwnerToken}`);

      expect(res.status).toBe(200);
      const projects = res.body.data;

      for (const p of projects) {
        expect(p.organizationId).toBe(globexOrgId);
        expect(p.id).not.toBe(acmeProjectId);
      }
    });

    it('IDOR Prevention: Acme user cannot GET Globex project directly', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${globexProjectId}`)
        .set('Authorization', `Bearer ${acmeOwnerToken}`);

      // Must be 404 (Not Found in tenant scope)
      expect(res.status).toBe(404);
    });

    it('IDOR Prevention: Acme user cannot DELETE Globex project', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${globexProjectId}`)
        .set('Authorization', `Bearer ${acmeOwnerToken}`);

      expect(res.status).toBe(404);
    });

    it('Tenant Isolation: Acme user cannot view Globex team members', async () => {
      const res = await request(app)
        .get('/api/v1/team/members')
        .set('Authorization', `Bearer ${acmeOwnerToken}`);

      expect(res.status).toBe(200);
      const members = res.body.data;
      const memberEmails = members.map((m: any) => m.email);

      expect(memberEmails).toContain('alice@acme.com');
      expect(memberEmails).not.toContain('eve@globex.com');
    });

    it('API Key Isolation: Acme API Key cannot access Globex data', async () => {
      const acmeKey = 'nqa_live_acme_secret_key_1234567890abcdef';

      const res = await request(app)
        .get(`/api/v1/projects/${globexProjectId}`)
        .set('x-api-key', acmeKey);

      expect(res.status).toBe(404);
    });
  });

  describe('3. Role-Based Permission Enforcement', () => {
    it('VIEWER cannot create a new project (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${acmeViewerToken}`)
        .send({
          name: 'Unauthorized Project',
          category: 'WEB'
        });

      expect(res.status).toBe(403);
    });

    it('VIEWER cannot trigger a test run (returns 403 Forbidden)', async () => {
      const env = await prisma.environment.findFirst({ where: { projectId: acmeProjectId } });

      const res = await request(app)
        .post('/api/v1/runs')
        .set('Authorization', `Bearer ${acmeViewerToken}`)
        .send({
          projectId: acmeProjectId,
          environmentId: env!.id
        });

      expect(res.status).toBe(403);
    });

    it('BILLING_MANAGER cannot create projects (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${acmeBillingToken}`)
        .send({
          name: 'Finance Project',
          category: 'WEB'
        });

      expect(res.status).toBe(403);
    });

    it('DEVELOPER can create a project and test cases', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${acmeDevToken}`)
        .send({
          name: `Dev Microservice ${Date.now()}`,
          category: 'BACKEND_SERVICE'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('QA_ENGINEER can trigger a test run', async () => {
      const env = await prisma.environment.findFirst({ where: { projectId: acmeProjectId } });

      const res = await request(app)
        .post('/api/v1/runs')
        .set('Authorization', `Bearer ${acmeQaToken}`)
        .send({
          projectId: acmeProjectId,
          environmentId: env!.id
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
    });

    it('OWNER can invite new members to organization', async () => {
      const res = await request(app)
        .post('/api/v1/team/invite')
        .set('Authorization', `Bearer ${acmeOwnerToken}`)
        .send({
          email: `qa_contractor_${Date.now()}@acme.com`,
          role: 'QA_ENGINEER'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('DEVELOPER cannot invite members (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/team/invite')
        .set('Authorization', `Bearer ${acmeDevToken}`)
        .send({
          email: 'unauthorized_invite@acme.com',
          role: 'QA_ENGINEER'
        });

      expect(res.status).toBe(403);
    });
  });
});
