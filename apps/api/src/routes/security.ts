import { Router, Request, Response, NextFunction } from 'express';
import { securityOrchestrator, dastScanner, sastScanner } from '@novaqa/security';
import { prisma } from '@novaqa/database';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '@novaqa/shared';

const router = Router();

// Apply auth middleware to all security routes
router.use(authMiddleware);

const DynamicScanSchema = z.object({
  targetUrl: z.string().url(),
  projectId: z.string().optional(),
  deepScan: z.boolean().optional()
});

const StaticScanSchema = z.object({
  projectId: z.string().optional(),
  sourceDirectory: z.string().optional(),
  fileContents: z.array(z.object({ path: z.string(), content: z.string() })).optional()
});

const FullAuditSchema = z.object({
  projectId: z.string(),
  targetUrl: z.string().url().optional(),
  sourceDirectory: z.string().optional(),
  persistFindings: z.boolean().default(true)
});

// 1. Dynamic API & Web Security Scan
router.post(
  '/scan-dynamic',
  requirePermission('project.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetUrl, projectId, deepScan } = DynamicScanSchema.parse(req.body);
      const findings = await dastScanner.scanTarget({ targetUrl, deepScan });
      res.json({
        success: true,
        targetUrl,
        findingsCount: findings.length,
        findings
      });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Static Source Code Scan
router.post(
  '/scan-static',
  requirePermission('project.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sourceDirectory, fileContents } = StaticScanSchema.parse(req.body);
      const findings = await sastScanner.scanSource({ sourceDirectory, fileContents });
      res.json({
        success: true,
        findingsCount: findings.length,
        findings
      });
    } catch (err) {
      next(err);
    }
  }
);

// 3. Full Combined Security Audit
router.post(
  '/audit-full',
  requirePermission('project.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, targetUrl, sourceDirectory, persistFindings } = FullAuditSchema.parse(req.body);
      const orgId = req.auth!.organizationId;

      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: orgId }
      });

      if (!project) {
        throw new NotFoundError(`Project ${projectId} not found in active organization.`);
      }

      const summary = await securityOrchestrator.runAudit({
        projectId: project.id,
        targetUrl: targetUrl || project.baseUrl || undefined,
        sourceDirectory,
        persistFindings
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }
);

// 4. Get Security Posture & Grade
router.get(
  '/posture',
  requirePermission('project.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const orgId = req.auth!.organizationId;

      const whereClause: any = {
        project: { organizationId: orgId }
      };

      if (projectId) {
        whereClause.projectId = projectId;
      }

      const findings = await prisma.finding.findMany({
        where: whereClause
      });

      const critical = findings.filter((f) => f.severity === 'CRITICAL').length;
      const high = findings.filter((f) => f.severity === 'HIGH').length;
      const medium = findings.filter((f) => f.severity === 'MEDIUM').length;
      const low = findings.filter((f) => f.severity === 'LOW').length;

      const deductions = critical * 25 + high * 10 + medium * 4 + low * 1;
      const score = Math.max(0, Math.min(100, 100 - deductions));

      let grade = 'A+';
      if (score >= 95) grade = 'A+';
      else if (score >= 90) grade = 'A';
      else if (score >= 80) grade = 'B';
      else if (score >= 70) grade = 'C';
      else if (score >= 60) grade = 'D';
      else grade = 'F';

      res.json({
        success: true,
        score,
        grade,
        summary: {
          total: findings.length,
          critical,
          high,
          medium,
          low
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// 5. Query Security Findings
router.get(
  '/findings',
  requirePermission('project.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, severity, category, cwe } = req.query;
      const orgId = req.auth!.organizationId;

      const where: any = {
        project: { organizationId: orgId }
      };

      if (projectId) where.projectId = projectId as string;
      if (severity) where.severity = (severity as string).toUpperCase();
      if (category) where.category = category as string;
      if (cwe) where.cwe = cwe as string;

      const findings = await prisma.finding.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true } } }
      });

      res.json({
        success: true,
        data: findings
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
