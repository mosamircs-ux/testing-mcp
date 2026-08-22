import { TestRun, TestResult, Finding } from '@novaqa/types';

export interface ReportData {
  run: TestRun;
  results: Array<TestResult & { testCaseTitle: string }>;
  findings?: Finding[];
}

export class JUnitReporter {
  static generate(data: ReportData): string {
    const { run, results } = data;
    const durationSec = (run.durationMs / 1000).toFixed(3);

    const testcasesXml = results
      .map((r) => {
        const itemSec = (r.durationMs / 1000).toFixed(3);
        const failureXml =
          r.status === 'FAILED'
            ? `\n      <failure message="${this.escapeXml(r.errorMessage || 'Test Failed')}">${this.escapeXml(r.stackTrace || r.errorMessage || '')}</failure>`
            : '';

        return `    <testcase name="${this.escapeXml(r.testCaseTitle)}" classname="NovaQA.Suite" time="${itemSec}">${failureXml}\n    </testcase>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="NovaQA Test Run" time="${durationSec}" tests="${run.totalTests}" failures="${run.failedTests}" skipped="${run.skippedTests}">
  <testsuite name="NovaQA Suite" tests="${run.totalTests}" failures="${run.failedTests}" skipped="${run.skippedTests}" time="${durationSec}">
${testcasesXml}
  </testsuite>
</testsuites>`;
  }

  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}

export class MarkdownReporter {
  static generate(data: ReportData): string {
    const { run, results, findings = [] } = data;
    const passRate = run.totalTests > 0 ? Math.round((run.passedTests / run.totalTests) * 100) : 0;
    const statusIcon = run.status === 'PASSED' ? '✅ PASSED' : run.status === 'FAILED' ? '❌ FAILED' : '⏳ ' + run.status;

    let md = `# NovaQA Test Run Summary: ${statusIcon}\n\n`;
    md += `| Total Tests | Passed | Failed | Skipped | Pass Rate | Duration |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    md += `| **${run.totalTests}** | 🟢 ${run.passedTests} | 🔴 ${run.failedTests} | ⚪ ${run.skippedTests} | **${passRate}%** | ${(run.durationMs / 1000).toFixed(1)}s |\n\n`;

    if (findings.length > 0) {
      md += `## 🤖 AI Failure Insights & Findings\n\n`;
      for (const finding of findings) {
        md += `### [${finding.severity}] ${finding.title} (${finding.category})\n`;
        md += `**Root Cause:** ${finding.rootCauseAnalysis}\n\n`;
        if (finding.suggestedFix) {
          md += `**Recommended Fix:** ${finding.suggestedFix}\n\n`;
        }
        if (finding.suggestedPatch) {
          md += `\`\`\`diff\n${finding.suggestedPatch}\n\`\`\`\n\n`;
        }
      }
    }

    md += `## 📋 Test Case Results\n\n`;
    for (const r of results) {
      const icon = r.status === 'PASSED' ? '✅' : '❌';
      md += `- ${icon} **${r.testCaseTitle}** (${r.durationMs}ms)\n`;
      if (r.errorMessage) {
        md += `  > Error: \`${r.errorMessage}\`\n`;
      }
    }

    return md;
  }
}
