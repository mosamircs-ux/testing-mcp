import { ProfessionalReport, ReportFormat } from './types.js';

export class ReportExporter {
  /**
   * Exports a ProfessionalReport into HTML, PDF (printable HTML), JSON, or CSV format.
   */
  static export(report: ProfessionalReport, format: ReportFormat | string): { content: string; mimeType: string; fileName: string } {
    const normalizedFormat = (format || 'HTML').toUpperCase();
    const safeTitle = report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    switch (normalizedFormat) {
      case ReportFormat.JSON:
      case 'JSON':
        return {
          content: JSON.stringify(report, null, 2),
          mimeType: 'application/json',
          fileName: `${safeTitle}-${report.id}.json`
        };

      case ReportFormat.CSV:
      case 'CSV':
        return {
          content: this.generateCsv(report),
          mimeType: 'text/csv',
          fileName: `${safeTitle}-${report.id}.csv`
        };

      case ReportFormat.PDF:
      case 'PDF':
        return {
          content: this.generateHtml(report, true),
          mimeType: 'text/html', // PDF-ready printable HTML document
          fileName: `${safeTitle}-${report.id}.html`
        };

      case ReportFormat.HTML:
      case 'HTML':
      default:
        return {
          content: this.generateHtml(report, false),
          mimeType: 'text/html',
          fileName: `${safeTitle}-${report.id}.html`
        };
    }
  }

  private static generateCsv(report: ProfessionalReport): string {
    const rows = [
      ['Report ID', report.id],
      ['Report Title', `"${report.title.replace(/"/g, '""')}"`],
      ['Report Type', report.reportType],
      ['Project Name', `"${report.projectName.replace(/"/g, '""')}"`],
      ['Environment', `"${report.environment.name}" (${report.environment.baseUrl})`],
      ['Application Version', report.applicationVersion],
      ['Generated Date', report.createdAt],
      ['Total Tests Executed', String(report.testsExecuted)],
      ['Passed Tests', String(report.passedTests)],
      ['Failed Tests', String(report.failedTests)],
      ['Flaky Tests', String(report.flakyTests)],
      ['Pass Rate (%)', `${report.passRate}%`],
      ['Failure Rate (%)', `${report.failureRate}%`],
      ['Route Coverage (%)', `${report.coverage.routeCoverage}%`],
      ['API Coverage (%)', `${report.coverage.apiCoverage}%`],
      ['Requirement Coverage (%)', `${report.coverage.requirementCoverage}%`],
      ['Overall Coverage (%)', `${report.coverage.overall}%`],
      ['Duration (ms)', String(report.durationMs)],
      ['Share Token', report.shareToken],
      [],
      ['Critical & High Issues'],
      ['Issue ID', 'Severity', 'Category', 'Title', 'Impact', 'Remediation']
    ];

    for (const issue of [...report.criticalIssues, ...report.highIssues]) {
      rows.push([
        issue.id,
        issue.severity,
        issue.category,
        `"${issue.title.replace(/"/g, '""')}"`,
        `"${issue.impact.replace(/"/g, '""')}"`,
        `"${(issue.remediation || '').replace(/"/g, '""')}"`
      ]);
    }

    return rows.map((r) => r.join(',')).join('\n');
  }

  private static generateHtml(report: ProfessionalReport, isPdfPrintable: boolean): string {
    const statusColor = report.passRate >= 95 ? '#10b981' : report.passRate >= 80 ? '#f59e0b' : '#ef4444';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title} — NovaQA Enterprise Report</title>
  <style>
    :root {
      --bg: #030712;
      --card-bg: #111827;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --border: #1f2937;
      --accent: #06b6d4;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 40px 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .logo span { color: var(--accent); }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      font-family: monospace;
    }
    .badge-type { background: #164e63; color: #67e8f9; border: 1px solid #0891b2; }
    .badge-critical { background: #4c0519; color: #fda4af; border: 1px solid #be123c; }
    .badge-high { background: #451a03; color: #fcd34d; border: 1px solid #d97706; }
    .badge-success { background: #064e3b; color: #6ee7b7; border: 1px solid #059669; }
    h1 { font-size: 24px; font-weight: 800; color: #fff; margin: 8px 0; }
    .meta { font-size: 12px; color: var(--text-muted); font-family: monospace; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .kpi-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); }
    .kpi-value { font-size: 28px; font-weight: 800; color: #fff; margin-top: 4px; }
    .section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .summary-text { font-size: 14px; color: #d1d5db; line-height: 1.7; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
    .table th { background: #1f2937; color: var(--text-muted); text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; }
    .table td { padding: 12px 14px; border-bottom: 1px solid var(--border); }
    .code-box {
      background: #030712;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      font-family: monospace;
      font-size: 12px;
      color: #38bdf8;
      overflow-x: auto;
      margin-top: 8px;
      white-space: pre-wrap;
    }
    .recommendations-list { padding-left: 20px; font-size: 13px; color: #d1d5db; }
    .recommendations-list li { margin-bottom: 8px; }
    .screenshot-card {
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin-top: 16px;
      background: #030712;
    }
    .screenshot-img { width: 100%; max-height: 400px; object-fit: cover; display: block; }
    .screenshot-caption { padding: 10px 14px; font-size: 12px; color: var(--text-muted); font-family: monospace; }
    .footer { text-align: center; font-size: 11px; color: var(--text-muted); margin-top: 40px; }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container { max-width: 100%; }
      .section, .kpi-card { background: #fff; border-color: #ccc; page-break-inside: avoid; }
      .kpi-value, .section-title, h1 { color: #000; }
      .summary-text, .recommendations-list { color: #333; }
      .code-box { background: #f3f4f6; color: #000; border-color: #ccc; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="logo">Nova<span>QA</span> Enterprise</div>
        <h1>${report.title}</h1>
        <div class="meta">
          Report ID: ${report.id} • Generated: ${new Date(report.createdAt).toUTCString()}
        </div>
        <div class="meta" style="margin-top: 4px;">
          Target Environment: <strong>${report.environment.name}</strong> (${report.environment.baseUrl}) • Version: <strong>${report.applicationVersion}</strong>
        </div>
      </div>
      <div>
        <span class="badge badge-type">${report.reportType}</span>
      </div>
    </div>

    <!-- KPI Metric Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Tests Executed</div>
        <div class="kpi-value">${report.testsExecuted}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Pass Rate</div>
        <div class="kpi-value" style="color: ${statusColor};">${report.passRate}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Overall Coverage</div>
        <div class="kpi-value" style="color: var(--accent);">${report.coverage.overall}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Execution Duration</div>
        <div class="kpi-value">${(report.durationMs / 1000).toFixed(1)}s</div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <p class="summary-text">${report.executiveSummary}</p>
    </div>

    <!-- Critical & High Issues -->
    ${
      report.criticalIssues.length > 0 || report.highIssues.length > 0
        ? `
    <div class="section">
      <div class="section-title">Critical & High Priority Findings (${report.criticalIssues.length + report.highIssues.length})</div>
      <table class="table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Category</th>
            <th>Issue Title</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
          ${[...report.criticalIssues, ...report.highIssues]
            .map(
              (i) => `
            <tr>
              <td><span class="badge ${i.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}">${i.severity}</span></td>
              <td style="font-family: monospace; font-size: 11px;">${i.category}</td>
              <td style="font-weight: 600;">${i.title}</td>
              <td style="color: var(--text-muted);">${i.impact}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : `
    <div class="section">
      <div class="section-title">Issues & Regressions</div>
      <p class="summary-text" style="color: var(--success); font-weight: 600;">Zero critical or high blockers identified during execution.</p>
    </div>
    `
    }

    <!-- Technical Evidence & Diagnostics -->
    ${
      report.evidence.length > 0
        ? `
    <div class="section">
      <div class="section-title">Technical Diagnostics & Evidence</div>
      ${report.evidence
        .map(
          (e) => `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: #fff;">${e.title} <span class="badge badge-type" style="margin-left: 8px;">${e.logType}</span></div>
          <div class="code-box">${e.excerpt}</div>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <!-- Screenshots & Viewports -->
    ${
      report.screenshots.length > 0
        ? `
    <div class="section">
      <div class="section-title">Visual Viewport Captures & Artifacts</div>
      <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
        ${report.screenshots
          .map(
            (s) => `
          <div class="screenshot-card">
            <img src="${s.url}" alt="${s.name}" class="screenshot-img" />
            <div class="screenshot-caption">${s.caption} (${s.name})</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    `
        : ''
    }

    <!-- Actionable Recommendations -->
    <div class="section">
      <div class="section-title">Strategic QA Recommendations</div>
      <ul class="recommendations-list">
        ${report.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
      </ul>
    </div>

    <div class="footer">
      Generated automatically by NovaQA Enterprise Autonomous Testing Platform • Share Token: ${report.shareToken}
    </div>
  </div>
</body>
</html>`;
  }
}
