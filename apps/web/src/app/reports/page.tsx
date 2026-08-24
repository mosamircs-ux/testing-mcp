'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Share2,
  GitCompare,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Smartphone,
  Server,
  Zap,
  Percent,
  Copy,
  Check,
  X,
  Eye,
  TrendingUp,
  ArrowRight,
  Clock
} from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  reportType: 'TEST_EXECUTION' | 'REGRESSION' | 'RELEASE' | 'SECURITY' | 'COVERAGE' | 'API' | 'MOBILE' | 'PERFORMANCE';
  environment: string;
  applicationVersion: string;
  testsExecuted: number;
  passRate: number;
  failureRate: number;
  flakyRate: number;
  coverage: number;
  criticalCount: number;
  highCount: number;
  durationMs: number;
  createdAt: string;
  shareToken: string;
  executiveSummary: string;
  recommendations: string[];
}

export default function ReportsManagementPage() {
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'COMPARE'>('HISTORY');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [shareModalToken, setShareModalToken] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate form state
  const [genType, setGenType] = useState('TEST_EXECUTION');
  const [genVersion, setGenVersion] = useState('v2.4.0-prod');
  const [genEnv, setGenEnv] = useState('Production Staging');

  // Comparison State
  const [runA, setRunA] = useState('RUN-PREV-884');
  const [runB, setRunB] = useState('RUN-CURR-992');
  const [comparisonData, setComparisonData] = useState({
    statusDelta: 'IMPROVED',
    passRateDelta: +3.3,
    newFailuresCount: 1,
    resolvedFailuresCount: 3,
    regressionsCount: 1,
    newTestsCount: 4,
    removedTestsCount: 0,
    coverageDelta: +3.4,
    perfDeltaMs: -340,
    securityScoreDelta: +6
  });

  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: 'REP-REG-001',
      title: 'Sprint 42 Full Regression Suite Health Report',
      reportType: 'REGRESSION',
      environment: 'Staging Sandbox',
      applicationVersion: 'v2.4.0-rc2',
      testsExecuted: 28,
      passRate: 96.4,
      failureRate: 3.6,
      flakyRate: 3.6,
      coverage: 95.8,
      criticalCount: 1,
      highCount: 1,
      durationMs: 18450,
      createdAt: 'Today at 09:45 UTC',
      shareToken: 'tok_reg_sprint42_a98f7e',
      executiveSummary:
        'Sprint 42 regression suite evaluated 19 core functional modules. Pass rate reached 96.4% with 1 real bug triaged and 2 auto-healed selectors. Zero blocking issues on core transaction checkout journeys.',
      recommendations: [
        'Deploy timeout boundary patch for address autocomplete in checkout form.',
        'Commit self-healed locators to source repository branch.'
      ]
    },
    {
      id: 'REP-REL-002',
      title: 'Production Release Candidate Sign-Off Audit',
      reportType: 'RELEASE',
      environment: 'Production Cluster',
      applicationVersion: 'v2.4.0-prod',
      testsExecuted: 42,
      passRate: 97.6,
      failureRate: 2.4,
      flakyRate: 0.0,
      coverage: 98.2,
      criticalCount: 0,
      highCount: 1,
      durationMs: 34100,
      createdAt: 'Yesterday at 18:20 UTC',
      shareToken: 'tok_rel_prod_b12c89',
      executiveSummary:
        'Release candidate build v2.4.0-prod passed all validation gates across web, API, mobile, and defensive security. Candidate approved for staged 10% -> 50% -> 100% canary deployment.',
      recommendations: [
        'Initiate staged canary rollout.',
        'Monitor API gateway p95 latency under active load.'
      ]
    },
    {
      id: 'REP-SEC-003',
      title: 'Defensive OWASP Top 10 & CWE Security Posture Audit',
      reportType: 'SECURITY',
      environment: 'Production Staging',
      applicationVersion: 'v2.4.0-prod',
      testsExecuted: 19,
      passRate: 89.5,
      failureRate: 10.5,
      flakyRate: 0.0,
      coverage: 94.0,
      criticalCount: 1,
      highCount: 2,
      durationMs: 12100,
      createdAt: '2 days ago',
      shareToken: 'tok_sec_audit_d43e21',
      executiveSummary:
        'Automated SAST & DAST posture evaluated at Grade A- (86/100). Flagged 1 JWT algorithm confusion vulnerability and 1 committed AWS access key with remediation diffs provided.',
      recommendations: [
        'Enforce strict RS256 algorithm validation on JWT verification.',
        'Rotate exposed AWS IAM credentials.'
      ]
    },
    {
      id: 'REP-COV-004',
      title: 'Application Topology & API Parameter Surface Matrix',
      reportType: 'COVERAGE',
      environment: 'Development',
      applicationVersion: 'v2.4.0-beta',
      testsExecuted: 36,
      passRate: 94.4,
      failureRate: 5.6,
      flakyRate: 2.8,
      coverage: 96.8,
      criticalCount: 0,
      highCount: 0,
      durationMs: 15200,
      createdAt: '3 days ago',
      shareToken: 'tok_cov_matrix_f98b76',
      executiveSummary:
        'Route coverage evaluated at 100% (8/8 application routes) and API endpoint parameter coverage at 96.5%. Identified 3 edge cases for supplemental automated scenario authoring.',
      recommendations: [
        'Add boundary checks for promo code expiration.',
        'Fuzz international postal codes in checkout form.'
      ]
    },
    {
      id: 'REP-MOB-005',
      title: 'Mobile Android & iOS Multi-Engine Sandbox Run',
      reportType: 'MOBILE',
      environment: 'Emulator Cluster',
      applicationVersion: 'v2.4.0-mobile',
      testsExecuted: 11,
      passRate: 90.9,
      failureRate: 9.1,
      flakyRate: 9.1,
      coverage: 91.0,
      criticalCount: 0,
      highCount: 1,
      durationMs: 32600,
      createdAt: '4 days ago',
      shareToken: 'tok_mob_suite_e23a45',
      executiveSummary:
        'Mobile worker sandboxes executed 11 native gesture, deep link, and push notification flows. Zero ANR or crash logs recorded.',
      recommendations: [
        'Enable biometric FaceID authentication mock in mobile test harness.'
      ]
    },
    {
      id: 'REP-PERF-006',
      title: 'Worker Concurrency & Latency Distribution Benchmark',
      reportType: 'PERFORMANCE',
      environment: 'Stress Cluster',
      applicationVersion: 'v2.4.0-prod',
      testsExecuted: 50,
      passRate: 100.0,
      failureRate: 0.0,
      flakyRate: 0.0,
      coverage: 100.0,
      criticalCount: 0,
      highCount: 0,
      durationMs: 41200,
      createdAt: '5 days ago',
      shareToken: 'tok_perf_bench_c56d78',
      executiveSummary:
        'Evaluated 32 concurrent parallel worker sandboxes. Average test execution time 1.28s (p95: 2.10s, p99: 3.42s).',
      recommendations: [
        'Increase worker browser context pooling to sustain peak 64 concurrent threads.'
      ]
    }
  ]);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: ReportItem = {
      id: `REP-${genType.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      title: `${genType.replace('_', ' ')} Executive Report (${genVersion})`,
      reportType: genType as any,
      environment: genEnv,
      applicationVersion: genVersion,
      testsExecuted: 24,
      passRate: 95.8,
      failureRate: 4.2,
      flakyRate: 4.2,
      coverage: 96.5,
      criticalCount: genType === 'SECURITY' ? 1 : 0,
      highCount: 1,
      durationMs: 16200,
      createdAt: 'Just now',
      shareToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
      executiveSummary: `Autonomous ${genType.replace('_', ' ')} report generated for ${genEnv} on build ${genVersion}. Achieved 95.8% pass rate with full telemetry and evidence.`,
      recommendations: [
        'Maintain continuous automated regression triggers.',
        'Review generated diagnostic evidence.'
      ]
    };

    setReports([newReport, ...reports]);
    setIsGenerateModalOpen(false);
    setSelectedReport(newReport);
  };

  const handleDownload = (report: ReportItem, format: 'PDF' | 'HTML' | 'JSON' | 'CSV') => {
    alert(`Exporting ${report.id} in ${format} format.`);
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/reports/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredReports = reports.filter((r) => {
    const matchesType = typeFilter === 'ALL' || r.reportType === typeFilter;
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.applicationVersion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileText className="h-6 w-6 text-cyan-400" />
              Professional QA & Release Reporting
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              8 Core Report Types
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Executive summaries, multi-format exports (PDF, HTML, JSON, CSV), read-only link sharing, and Run A vs Run B comparison.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold"
          >
            <Plus className="h-4 w-4" />
            Generate New Report
          </button>
        </div>
      </div>

      {/* Main Tabs: Report History vs Run Comparison */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'HISTORY' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4 text-cyan-400" />
          Report History ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('COMPARE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'COMPARE' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare className="h-4 w-4 text-accent-400" />
          Run A vs Run B Comparison
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REPORT HISTORY                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          {/* Toolbar Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports by ID, title, or version..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-sans"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 text-xs text-slate-300 px-3 py-2 rounded-lg border border-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Report Types</option>
              <option value="TEST_EXECUTION">Test Execution</option>
              <option value="REGRESSION">Regression</option>
              <option value="RELEASE">Release Candidate</option>
              <option value="SECURITY">Security Posture</option>
              <option value="COVERAGE">Coverage Matrix</option>
              <option value="API">API Quality</option>
              <option value="MOBILE">Mobile Sandbox</option>
              <option value="PERFORMANCE">Performance Load</option>
            </select>
          </div>

          {/* Reports Table + Detail Drawer Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`space-y-4 ${selectedReport ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Report Title & ID</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Version</th>
                        <th className="px-3 py-3">Pass Rate</th>
                        <th className="px-3 py-3">Coverage</th>
                        <th className="px-3 py-3">Duration</th>
                        <th className="px-3 py-3">Generated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredReports.map((r) => {
                        const isSelected = selectedReport?.id === r.id;

                        return (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedReport(r)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-slate-800/80 border-l-2 border-cyan-500'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-4 py-3.5 font-sans">
                              <div className="font-bold text-slate-100">{r.title}</div>
                              <div className="text-[11px] text-cyan-400 font-mono mt-0.5">{r.id} • {r.environment}</div>
                            </td>

                            <td className="px-3 py-3.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                                {r.reportType}
                              </span>
                            </td>

                            <td className="px-3 py-3.5 text-slate-300 text-[11px]">
                              {r.applicationVersion}
                            </td>

                            <td className="px-3 py-3.5">
                              <span
                                className={`font-bold ${
                                  r.passRate >= 95 ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                              >
                                {r.passRate}%
                              </span>
                            </td>

                            <td className="px-3 py-3.5 text-cyan-400 font-bold">
                              {r.coverage}%
                            </td>

                            <td className="px-3 py-3.5 text-slate-400 text-[11px]">
                              {(r.durationMs / 1000).toFixed(1)}s
                            </td>

                            <td className="px-3 py-3.5 text-slate-400 text-[11px]">
                              {r.createdAt}
                            </td>

                            <td className="px-4 py-3.5 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setShareModalToken(r.shareToken)}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                                  title="Share Read-Only Link"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDownload(r, 'PDF')}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                                  title="Export PDF"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Slide-Over Report Inspection Drawer */}
            {selectedReport && (
              <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl relative">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{selectedReport.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedReport.reportType}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white leading-snug">{selectedReport.title}</h2>

                  {/* Summary */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Executive Summary
                    </label>
                    <p className="mt-1 p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                      {selectedReport.executiveSummary}
                    </p>
                  </div>

                  {/* KPI Tile Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Pass Rate</div>
                      <div className="text-emerald-400 font-extrabold mt-0.5">{selectedReport.passRate}%</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Coverage</div>
                      <div className="text-cyan-400 font-extrabold mt-0.5">{selectedReport.coverage}%</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Criticals</div>
                      <div className="text-rose-400 font-extrabold mt-0.5">{selectedReport.criticalCount}</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Recommendations
                    </label>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                      {selectedReport.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Exporter Action Buttons */}
                <div className="pt-4 border-t border-slate-800 space-y-2 font-sans">
                  <div className="text-[11px] font-bold uppercase text-slate-400">Export Document Formats</div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleDownload(selectedReport, 'PDF')}
                      className="px-2 py-1.5 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownload(selectedReport, 'HTML')}
                      className="px-2 py-1.5 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center"
                    >
                      HTML
                    </button>
                    <button
                      onClick={() => handleDownload(selectedReport, 'JSON')}
                      className="px-2 py-1.5 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => handleDownload(selectedReport, 'CSV')}
                      className="px-2 py-1.5 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center"
                    >
                      CSV
                    </button>
                  </div>

                  <button
                    onClick={() => setShareModalToken(selectedReport.shareToken)}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share Read-Only Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RUN A VS RUN B COMPARISON                                          */}
      {/* ========================================================================= */}
      {activeTab === 'COMPARE' && (
        <div className="space-y-6">
          {/* Comparison Selectors */}
          <div className="p-6 glass-panel rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-accent-400" />
              Differential Test Run Comparison (Run A vs Run B)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-400">Baseline Build (Run A)</label>
                <select
                  value={runA}
                  onChange={(e) => setRunA(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none"
                >
                  <option value="RUN-PREV-884">Run #884 — v2.3.9-build.884 (Pass Rate: 92.5%)</option>
                  <option value="RUN-PREV-880">Run #880 — v2.3.8-build.880 (Pass Rate: 90.0%)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-400">Target Build (Run B)</label>
                <select
                  value={runB}
                  onChange={(e) => setRunB(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none"
                >
                  <option value="RUN-CURR-992">Run #992 — v2.4.0-build.992 (Pass Rate: 95.8%) [TARGET]</option>
                  <option value="RUN-CURR-990">Run #990 — v2.4.0-rc1 (Pass Rate: 94.2%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Delta KPI Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-emerald-950/80 bg-emerald-950/10">
              <span className="text-xs font-bold uppercase text-emerald-400">Pass Rate Delta</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">+{comparisonData.passRateDelta}%</div>
              <span className="text-[11px] text-emerald-500 mt-1">Improved overall health</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-rose-950/80 bg-rose-950/10">
              <span className="text-xs font-bold uppercase text-rose-400">New Regressions</span>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">{comparisonData.regressionsCount}</div>
              <span className="text-[11px] text-rose-500 mt-1">1 previously passing test failed</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-cyan-950/80 bg-cyan-950/10">
              <span className="text-xs font-bold uppercase text-cyan-400">Coverage Delta</span>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1">+{comparisonData.coverageDelta}%</div>
              <span className="text-[11px] text-cyan-500 mt-1">+4 newly mapped edge tests</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-purple-950/80 bg-purple-950/10">
              <span className="text-xs font-bold uppercase text-purple-400">Latency Delta (p95)</span>
              <div className="text-2xl font-extrabold text-purple-400 mt-1">{comparisonData.perfDeltaMs}ms</div>
              <span className="text-[11px] text-purple-500 mt-1">14.2% faster execution</span>
            </div>
          </div>

          {/* Detailed Differences Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Failures & Regressions */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-400" />
                  New Failures & Regressions ({comparisonData.newFailuresCount})
                </h3>
              </div>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-950/60">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-rose-300">TC-CART-004</span>
                    <span className="text-rose-400 font-bold uppercase">REGRESSION</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">Verify Shopping Cart Checkout with Express Shipping</h4>
                  <p className="text-[11px] text-slate-300 mt-1 font-mono">
                    Passed in Run #884, failed in Run #992: Timeout waiting for payment modal.
                  </p>
                </div>
              </div>
            </div>

            {/* Resolved Failures */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Resolved Failures in Target Build ({comparisonData.resolvedFailuresCount})
                </h3>
              </div>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-950/60">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-emerald-300">TC-AUTH-002</span>
                    <span className="text-emerald-400 font-bold uppercase">RESOLVED</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">Enforce RBAC Permission Guard on Billing Portal</h4>
                  <p className="text-[11px] text-slate-300 mt-1 font-mono">
                    Failed in Run #884 due to selector drift; healed and verified passing in Run #992.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: GENERATE NEW REPORT MODAL                                        */}
      {/* ========================================================================= */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsGenerateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Generate Professional QA Report
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select report type, target version, and environment.
              </p>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Report Category</label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                  className="w-full mt-1 bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none"
                >
                  <option value="TEST_EXECUTION">Test Execution Report</option>
                  <option value="REGRESSION">Regression Suite Health Report</option>
                  <option value="RELEASE">Release Candidate Sign-Off Report</option>
                  <option value="SECURITY">Defensive OWASP & CWE Security Audit</option>
                  <option value="COVERAGE">Topology & Traceability Coverage Matrix</option>
                  <option value="API">API Quality & Schema Contract Report</option>
                  <option value="MOBILE">Mobile Sandbox Flow Report</option>
                  <option value="PERFORMANCE">Performance Latency & Concurrency Report</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Build Version</label>
                  <input
                    type="text"
                    value={genVersion}
                    onChange={(e) => setGenVersion(e.target.value)}
                    className="w-full mt-1 bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Environment</label>
                  <input
                    type="text"
                    value={genEnv}
                    onChange={(e) => setGenEnv(e.target.value)}
                    className="w-full mt-1 bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition"
                >
                  Synthesize Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SHAREABLE READ-ONLY LINK MODAL                                   */}
      {/* ========================================================================= */}
      {shareModalToken && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShareModalToken(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="h-5 w-5 text-cyan-400" />
                Share Read-Only Report Link
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Anyone with this secure link can view this executive report without requiring account credentials.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-slate-300">
              <span className="truncate pr-2">
                {typeof window !== 'undefined' ? `${window.location.origin}/reports/share/${shareModalToken}` : `/reports/share/${shareModalToken}`}
              </span>
              <button
                onClick={() => copyShareLink(shareModalToken)}
                className="p-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center gap-1"
                title="Copy Link"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {copiedLink && (
              <div className="text-xs font-semibold text-emerald-400 text-center animate-in fade-in">
                Link copied to clipboard!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
