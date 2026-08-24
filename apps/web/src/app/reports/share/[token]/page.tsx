'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  Code2,
  Terminal,
  Cpu
} from 'lucide-react';

export default function PublicSharedReportPage({ params }: { params: { token: string } }) {
  const [downloadFormat, setDownloadFormat] = useState('PDF');

  const report = {
    id: `REP-EXEC-${params.token.substring(0, 6).toUpperCase()}`,
    title: 'Sprint 42 Full Regression & Release Candidate Health Report',
    reportType: 'REGRESSION',
    applicationVersion: 'v2.4.0-prod',
    environment: {
      name: 'Production Staging Sandbox',
      baseUrl: 'https://staging.acme.com',
      tier: 'staging'
    },
    testsExecuted: 28,
    passedTests: 27,
    failedTests: 1,
    flakyTests: 1,
    blockedTests: 0,
    passRate: 96.4,
    failureRate: 3.6,
    flakyRate: 3.6,
    durationMs: 18450,
    coverage: {
      routeCoverage: 100,
      apiCoverage: 96.5,
      requirementCoverage: 94.0,
      overall: 96.8
    },
    executiveSummary:
      'The automated regression suite evaluated 19 core functional areas across Production Staging. Pass rate achieved 96.4% with 1 real bug triaged and 2 healed selector drifts with zero blocking regressions on core checkout journeys. Release candidate approved for staged rollout.',
    criticalIssues: [
      {
        id: 'ISSUE-REG-01',
        title: 'Checkout Autocomplete Timeout Regression',
        severity: 'CRITICAL',
        category: 'REAL_BUG',
        description: 'Async Google Places script callback blocked order submission thread.',
        impact: 'Users on slow 3G networks experience hanging checkout buttons.',
        remediation: 'Implement 2000ms promise race timeout with offline address fallback.'
      }
    ],
    highIssues: [
      {
        id: 'ISSUE-REG-02',
        title: 'Submit Button Selector Drift in DOM',
        severity: 'HIGH',
        category: 'SELECTOR_DRIFT',
        description: 'Frontend component migration modified button ID attribute.',
        impact: 'Brittle test locator failure.',
        remediation: 'Auto-healed step locator to [data-testid="checkout-submit-btn"].'
      }
    ],
    screenshots: [
      {
        name: 'checkout_step_failure.png',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
        caption: 'Live browser viewport snapshot on checkout payment authorization step'
      }
    ],
    evidence: [
      {
        title: 'Browser Console & Network Log Excerpt',
        excerpt:
          '[10:24:12] POST /api/v1/checkout 500 Internal Server Error (Duration: 5210ms)\n[10:24:13] Unhandled Promise Rejection: Address validation callback timed out',
        logType: 'CONSOLE'
      }
    ],
    recommendations: [
      'Deploy timeout boundary patch for address autocomplete in checkout form.',
      'Commit self-healed locators to source repository branch.',
      'Maintain 95%+ pass rate threshold before initiating staging deployment.'
    ],
    shareToken: params.token,
    createdAt: 'August 24, 2026 at 09:45 UTC'
  };

  const handleExport = (fmt: string) => {
    alert(`Downloading public report in ${fmt} format.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Public Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-accent-500 flex items-center justify-center">
                <Cpu className="h-3.5 w-3.5 text-slate-950 font-bold" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">NovaQA Enterprise Reporting</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-bold">
                PUBLIC READ-ONLY SHARE
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{report.title}</h1>
            <div className="text-xs text-slate-400 font-mono mt-1">
              Report ID: {report.id} • Environment: {report.environment.name} • Version: {report.applicationVersion}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['PDF', 'HTML', 'JSON', 'CSV'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition"
              >
                <Download className="h-3 w-3" />
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold uppercase text-slate-400">Tests Executed</span>
            <div className="text-3xl font-extrabold text-white mt-1">{report.testsExecuted}</div>
            <span className="text-[11px] text-cyan-400 mt-1">{report.passedTests} Passed • {report.failedTests} Failed</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-emerald-950/80 bg-emerald-950/10">
            <span className="text-xs font-bold uppercase text-emerald-400">Pass Rate</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">{report.passRate}%</div>
            <span className="text-[11px] text-emerald-500 mt-1">SLA Target &gt; 95%</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-cyan-950/80 bg-cyan-950/10">
            <span className="text-xs font-bold uppercase text-cyan-400">Overall Coverage</span>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1">{report.coverage.overall}%</div>
            <span className="text-[11px] text-cyan-500 mt-1">Routes & API Surface</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold uppercase text-purple-400">Execution Runtime</span>
            <div className="text-3xl font-extrabold text-white mt-1">{(report.durationMs / 1000).toFixed(1)}s</div>
            <span className="text-[11px] text-purple-400 mt-1">Parallel worker sandbox</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <h2 className="text-sm font-bold uppercase text-slate-400">Executive Summary</h2>
          <p className="text-sm text-slate-200 leading-relaxed">{report.executiveSummary}</p>
        </div>

        {/* Critical & High Issues */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase text-slate-400">
            Identified Findings & Regressions ({report.criticalIssues.length + report.highIssues.length})
          </h2>

          <div className="space-y-3">
            {[...report.criticalIssues, ...report.highIssues].map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      issue.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <span className="text-slate-500">{issue.category}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{issue.title}</h3>
                <p className="text-xs text-slate-300">{issue.description}</p>
                <div className="pt-2 border-t border-slate-800 text-xs text-emerald-400 font-mono">
                  Remediation: {issue.remediation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Diagnostics & Evidence */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold uppercase text-slate-400">Technical Diagnostics & Console Logs</h2>
          {report.evidence.map((e, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="text-xs font-bold text-slate-300">{e.title}</div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 overflow-x-auto">
                {e.excerpt}
              </pre>
            </div>
          ))}
        </div>

        {/* Screenshots & Visual Viewports */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold uppercase text-slate-400">Visual Viewport Captures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.screenshots.map((s, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <img src={s.url} alt={s.name} className="w-full h-48 object-cover" />
                <div className="p-3 text-xs text-slate-400 font-mono">{s.caption}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold uppercase text-emerald-400">Strategic Recommendations</h2>
          <ul className="space-y-2 text-xs text-slate-300 list-disc pl-5">
            {report.recommendations.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="text-center text-xs text-slate-500 pt-4">
          Generated automatically by NovaQA Enterprise Autonomous Testing Platform • Share Token: {report.shareToken}
        </div>
      </div>
    </div>
  );
}
