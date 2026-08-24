import { prisma } from '@novaqa/database';
import {
  Finding,
  FindingCategory,
  FindingStatus,
  FixHistoryEntry
} from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('ai-fix-proposal-engine');

export interface FixProposalResult {
  findingId: string;
  category: FindingCategory;
  title: string;
  patchDiff: string;
  affectedFiles: string[];
  regressionRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  requiresExplicitApproval: boolean;
  explanation: string;
}

export class FixProposalEngine {
  /**
   * Generates a structured fix proposal and unified git diff patch for an identified finding.
   * Requires explicit user approval for any product code modification.
   */
  async generateFixProposal(findingId: string): Promise<FixProposalResult | null> {
    log.info({ findingId }, 'Generating fix proposal and patch diff');

    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: { project: true, testResult: { include: { testCase: true } } }
    });

    if (!finding) {
      log.warn({ findingId }, 'Finding not found for fix proposal generation');
      return null;
    }

    const category = finding.category as FindingCategory;
    const isProductCodeBug =
      category === FindingCategory.REAL_BUG ||
      category === FindingCategory.DATA_ISSUE ||
      category === FindingCategory.AUTHENTICATION_ISSUE ||
      category === FindingCategory.PERMISSION_ISSUE;

    // Determine if explicit user approval is required
    // Safe non-semantic test maintenance can auto-apply if project settings permit; genuine code fixes ALWAYS require user approval.
    const requiresExplicitApproval = isProductCodeBug;

    let patchDiff = finding.suggestedPatch;
    let affectedFiles: string[] = [];

    try {
      if (finding.affectedFiles) {
        affectedFiles = typeof finding.affectedFiles === 'string'
          ? JSON.parse(finding.affectedFiles)
          : (finding.affectedFiles as any);
      }
    } catch {}

    if (!patchDiff) {
      if (category === FindingCategory.SELECTOR_DRIFT && finding.autoHealSelector) {
        patchDiff = `--- a/test.spec.ts\n+++ b/test.spec.ts\n- await page.click('${finding.title}');\n+ await page.click('${finding.autoHealSelector}');`;
        affectedFiles = ['tests/e2e.spec.ts'];
      } else if (category === FindingCategory.TIMING_ISSUE) {
        patchDiff = `--- a/test.spec.ts\n+++ b/test.spec.ts\n- await page.waitForTimeout(3000);\n+ await page.waitForLoadState('networkidle');`;
        affectedFiles = ['tests/e2e.spec.ts'];
      } else {
        patchDiff = `--- a/src/app.ts\n+++ b/src/app.ts\n// Fix: ${finding.suggestedFix || 'Add defensive null-check'}`;
        affectedFiles = ['src/app.ts'];
      }
    }

    const initialHistory = this.parseHistory(finding.fixHistory);
    initialHistory.push({
      timestamp: new Date().toISOString(),
      action: 'PROPOSED',
      actor: 'AI_FAILURE_ANALYZER',
      details: `Generated proposed fix patch for ${category}`,
      patchDiff
    });

    await prisma.finding.update({
      where: { id: findingId },
      data: {
        status: FindingStatus.FIX_PROPOSED,
        suggestedPatch: patchDiff,
        fixHistory: JSON.stringify(initialHistory)
      }
    });

    return {
      findingId: finding.id,
      category,
      title: finding.title,
      patchDiff,
      affectedFiles,
      regressionRisk: (finding.regressionRisk as 'HIGH' | 'MEDIUM' | 'LOW') || (isProductCodeBug ? 'HIGH' : 'LOW'),
      requiresExplicitApproval,
      explanation: finding.suggestedFix || 'Apply defensive error handling and schema validation.'
    };
  }

  /**
   * Explicit approval gateway: Operator approves proposed fix patch for application
   */
  async approveFix(
    findingId: string,
    options: {
      actor?: string;
      patchOverride?: string;
      notes?: string;
    } = {}
  ): Promise<{ success: boolean; finding?: Finding; message: string }> {
    log.info({ findingId, actor: options.actor }, 'Operator approving fix proposal');

    const finding = await prisma.finding.findUnique({
      where: { id: findingId }
    });

    if (!finding) {
      return { success: false, message: `Finding '${findingId}' not found.` };
    }

    const history = this.parseHistory(finding.fixHistory);
    const patchToApply = options.patchOverride || finding.suggestedPatch || '';

    history.push({
      timestamp: new Date().toISOString(),
      action: 'APPROVED',
      actor: options.actor || 'OPERATOR',
      details: options.notes || 'Explicit approval granted by operator for patch application.',
      patchDiff: patchToApply
    });

    const updated = await prisma.finding.update({
      where: { id: findingId },
      data: {
        status: FindingStatus.FIX_APPROVED,
        fixApproved: true,
        fixAppliedAt: new Date(),
        suggestedPatch: patchToApply,
        fixHistory: JSON.stringify(history)
      }
    });

    return {
      success: true,
      finding: updated as any,
      message: 'Fix proposal approved successfully. Ready for verification pipeline.'
    };
  }

  /**
   * Rollback an applied fix and revert finding status
   */
  async rollbackFix(
    findingId: string,
    options: { actor?: string; reason?: string } = {}
  ): Promise<{ success: boolean; message: string }> {
    log.info({ findingId, actor: options.actor }, 'Rolling back applied fix');

    const finding = await prisma.finding.findUnique({
      where: { id: findingId }
    });

    if (!finding) {
      return { success: false, message: `Finding '${findingId}' not found.` };
    }

    const history = this.parseHistory(finding.fixHistory);
    history.push({
      timestamp: new Date().toISOString(),
      action: 'ROLLED_BACK',
      actor: options.actor || 'OPERATOR',
      details: options.reason || 'Fix rolled back due to verification failure or operator request.'
    });

    await prisma.finding.update({
      where: { id: findingId },
      data: {
        status: FindingStatus.OPEN,
        fixApproved: false,
        fixHistory: JSON.stringify(history)
      }
    });

    return {
      success: true,
      message: 'Fix has been rolled back. Finding returned to OPEN status.'
    };
  }

  /**
   * Retrieve structured fix history audit log
   */
  async getFixHistory(findingId: string): Promise<FixHistoryEntry[]> {
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      select: { fixHistory: true }
    });

    if (!finding) return [];
    return this.parseHistory(finding.fixHistory);
  }

  private parseHistory(rawHistory?: string | null): FixHistoryEntry[] {
    if (!rawHistory) return [];
    try {
      return typeof rawHistory === 'string' ? JSON.parse(rawHistory) : rawHistory;
    } catch {
      return [];
    }
  }
}

export const fixProposalEngine = new FixProposalEngine();
