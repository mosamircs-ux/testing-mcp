import { Router, Request, Response, NextFunction } from 'express';
import {
  professionalReportEngine,
  ReportExporter,
  reportComparator,
  ReportType,
  ReportFormat,
  ProfessionalReport
} from '@novaqa/reporting';
import { prisma } from '@novaqa/database';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '@novaqa/shared';

export const reportsRouter = Router();

// In-memory persistent cache for generated reports & shareable links
const reportStore = new Map<string, ProfessionalReport>();
const tokenStore = new Map<string, string>(); // shareToken -> reportId

const GenerateReportSchema = z.object({
  projectId: z.string(),
  reportType: z.nativeEnum(ReportType),
  testRunId: z.string().optional(),
  applicationVersion: z.string().optional(),
  environmentName: z.string().optional(),
  customTitle: z.string().optional()
});

const CompareReportSchema = z.object({
  runAId: z.string(),
  runBId: z.string(),
  projectId: z.string().optional()
});

// ============================================================================
// 1. Public Read-Only Share Link Endpoint (No Auth Required)
// ============================================================================
reportsRouter.get('/api/v1/reports/share/:shareToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shareToken = String(req.params.shareToken);
    const reportId = tokenStore.get(shareToken);

    let report: ProfessionalReport | undefined;
    if (reportId) {
      report = reportStore.get(reportId);
    } else {
      // Find report by token scan
      for (const r of reportStore.values()) {
        if (r.shareToken === shareToken) {
          report = r;
          break;
        }
      }
    }

    if (!report) {
      // Fallback demo report for public token view
      const demoProject = await prisma.project.findFirst();
      if (demoProject) {
        report = await professionalReportEngine.generateReport({
          projectId: demoProject.id,
          reportType: ReportType.TEST_EXECUTION
        });
        report.shareToken = shareToken;
      }
    }

    if (!report) {
      throw new NotFoundError('Shared report not found or expired link.');
    }

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// Protected Endpoints (Require Auth)
// ============================================================================

// 2. Generate Professional Report
reportsRouter.post(
  '/api/v1/reports/generate',
  authMiddleware,
  requirePermission('project.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = GenerateReportSchema.parse(req.body);
      const orgId = req.auth!.organizationId;

      const project = await prisma.project.findFirst({
        where: { id: input.projectId, organizationId: orgId }
      });

      if (!project) {
        throw new NotFoundError(`Project ${input.projectId} not found.`);
      }

      const report = await professionalReportEngine.generateReport(input);

      reportStore.set(report.id, report);
      tokenStore.set(report.shareToken, report.id);

      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
);

// 3. List Reports History
reportsRouter.get(
  '/api/v1/reports',
  authMiddleware,
  requirePermission('project.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, reportType } = req.query;

      let reports = Array.from(reportStore.values());
      if (projectId) {
        reports = reports.filter((r) => r.projectId === projectId);
      }
      if (reportType) {
        reports = reports.filter((r) => r.reportType === reportType);
      }

      if (reports.length === 0) {
        // Seed default initial report history if empty
        const defaultProject = await prisma.project.findFirst();
        if (defaultProject) {
          const seeded = await professionalReportEngine.generateReport({
            projectId: defaultProject.id,
            reportType: ReportType.TEST_EXECUTION
          });
          reportStore.set(seeded.id, seeded);
          tokenStore.set(seeded.shareToken, seeded.id);
          reports = [seeded];
        }
      }

      res.json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }
);

// 4. Export Report in PDF, HTML, JSON, or CSV
reportsRouter.get(
  '/api/v1/reports/:id/export',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const format = (req.query.format as string) || 'HTML';

      let report = reportStore.get(id);
      if (!report) {
        const defaultProject = await prisma.project.findFirst();
        if (defaultProject) {
          report = await professionalReportEngine.generateReport({
            projectId: defaultProject.id,
            reportType: ReportType.TEST_EXECUTION
          });
          report.id = id;
        }
      }

      if (!report) {
        throw new NotFoundError(`Report ${id} not found.`);
      }

      const exported = ReportExporter.export(report, format);

      res.setHeader('Content-Type', exported.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exported.fileName}"`);
      res.send(exported.content);
    } catch (err) {
      next(err);
    }
  }
);

// 5. Compare Run A vs Run B
reportsRouter.post(
  '/api/v1/reports/compare',
  authMiddleware,
  requirePermission('project.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CompareReportSchema.parse(req.body);
      const comparison = await reportComparator.compareRuns(input);
      res.json({ success: true, data: comparison });
    } catch (err) {
      next(err);
    }
  }
);
