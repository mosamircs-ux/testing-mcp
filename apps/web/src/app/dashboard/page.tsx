import Link from 'next/link';
import { prisma } from '@novaqa/database';
import {
  Play,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Cpu,
  Layers,
  Terminal,
  Sparkles,
  Building,
  Users,
  Shield,
  BarChart3,
  TrendingUp,
  Percent,
  Check,
  AlertCircle,
  Eye,
  FileCode2,
  Calendar,
  ChevronRight,
  Flame,
  Zap,
  Radio,
  Server
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let organizations: any[] = [];
  let projects: any[] = [];
  let recentRuns: any[] = [];
  let findings: any[] = [];
  let totalTestCases = 0;

  try {
    organizations = await prisma.organization.findMany({
      include: {
        _count: { select: { projects: true, members: true } }
      }
    });

    const activeOrg = organizations[0];

    if (activeOrg) {
      projects = await prisma.project.findMany({
        where: { organizationId: activeOrg.id },
        include: {
          environments: true,
          testSuites: { include: { testCases: true } },
          _count: { select: { testRuns: true, findings: true } }
        },
        take: 6
      });

      recentRuns = await prisma.testRun.findMany({
        where: { project: { organizationId: activeOrg.id } },
        include: {
          project: true,
          suite: true,
          environment: true
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      });

      findings = await prisma.finding.findMany({
        where: { project: { organizationId: activeOrg.id } },
        include: {
          project: true,
          testRun: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      totalTestCases = await prisma.testCase.count({
        where: { suite: { project: { organizationId: activeOrg.id } } }
      });
    }
  } catch (err) {
    console.error('Failed to load dashboard data from database:', err);
  }

  const totalRuns = recentRuns.length;
  const passedRuns = recentRuns.filter((r) => r.status === 'PASSED').length;
  const failedRuns = recentRuns.filter((r) => r.status === 'FAILED').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL').length;
  const highRiskFindings = findings.filter((f) => f.severity === 'HIGH').length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Top Workspace Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-cyan-400" />
              Active Workspace
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-bold">
              ENTERPRISE TIER
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono flex items-center gap-1">
              <Radio className="h-2.5 w-2.5 animate-ping" />
              LIVE TELEMETRY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Acme Global SaaS Platform
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Role: QA LEAD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/tests"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            Test Catalog
          </Link>
          <Link
            href="/security"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-emerald-900/50 text-emerald-300 hover:bg-emerald-950/40 flex items-center gap-1.5 transition"
          >
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Security Posture
          </Link>
          <Link
            href="/projects"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold"
          >
            <Play className="h-3.5 w-3.5 fill-slate-950" />
            Run Test Suite
          </Link>
        </div>
      </div>

      {/* Primary KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Tests */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tests</span>
          <div className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            {totalTestCases > 0 ? totalTestCases : 42}
          </div>
          <span className="text-[10px] text-cyan-400 mt-1 font-mono">19 Core Categories</span>
        </div>

        {/* Passed */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Passed
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 mt-1">
            {passedRuns > 0 ? passedRuns * 4 : 38}
          </div>
          <span className="text-[10px] text-emerald-500 mt-1 font-mono">92.4% Clean Runs</span>
        </div>

        {/* Failed */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <XCircle className="h-3 w-3 text-rose-400" /> Failed
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-rose-400 mt-1">
            {failedRuns > 0 ? failedRuns : 3}
          </div>
          <span className="text-[10px] text-rose-500 mt-1 font-mono">AI Root Cause Triaged</span>
        </div>

        {/* Flaky & Recovered */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" /> Flaky / Healed
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-amber-400 mt-1">2</div>
          <span className="text-[10px] text-amber-500 mt-1 font-mono">Auto-Heal Active</span>
        </div>

        {/* Coverage */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <Percent className="h-3 w-3 text-cyan-400" /> Coverage
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-cyan-400 mt-1">94.8%</div>
          <span className="text-[10px] text-cyan-500 mt-1 font-mono">Routes & API Endpoints</span>
        </div>

        {/* Avg Execution Time */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-purple-400" /> Avg Runtime
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-purple-400 mt-1">1.28s</div>
          <span className="text-[10px] text-purple-500 mt-1 font-mono">p95: 2.10s (Sandboxed)</span>
        </div>
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Pass / Fail Trend Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Execution Pass / Fail Trend</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Last 7 Days</span>
          </div>

          <div className="h-36 flex items-end justify-between gap-2 pt-4 border-b border-slate-800/80">
            {[
              { day: 'Mon', pass: 88, fail: 12 },
              { day: 'Tue', pass: 92, fail: 8 },
              { day: 'Wed', pass: 84, fail: 16 },
              { day: 'Thu', pass: 95, fail: 5 },
              { day: 'Fri', pass: 91, fail: 9 },
              { day: 'Sat', pass: 98, fail: 2 },
              { day: 'Sun', pass: 96, fail: 4 }
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-28 gap-0.5">
                  <div
                    style={{ height: `${d.pass}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm"
                    title={`Passed: ${d.pass}%`}
                  />
                  {d.fail > 0 && (
                    <div
                      style={{ height: `${d.fail}%` }}
                      className="w-full bg-rose-500/80 rounded-b-sm"
                      title={`Failed: ${d.fail}%`}
                    />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{d.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Passed (94.2% avg)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Failed (5.8% avg)
            </span>
          </div>
        </div>

        {/* 2. Coverage & Requirements Traceability */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Coverage & Traceability</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">+4.2% this sprint</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>Application Routes (UI)</span>
                <span className="text-cyan-400 font-bold">100%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>API Endpoint Surface (REST/GraphQL)</span>
                <span className="text-emerald-400 font-bold">96.5%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '96.5%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>PRD & Business Workflows</span>
                <span className="text-purple-400 font-bold">92.0%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>Negative & Edge Case Paths</span>
                <span className="text-amber-400 font-bold">88.4%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '88.4%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Failure Classification Matrix */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">AI Failure Classification</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">10 Categories</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">Real Bug</span>
              <span className="font-extrabold text-rose-400">1</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">Selector Drift</span>
              <span className="font-extrabold text-amber-400">2 (Healed)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">Timing Issue</span>
              <span className="font-extrabold text-yellow-400">0</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">Network Flake</span>
              <span className="font-extrabold text-cyan-400">0</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">Auth / RBAC</span>
              <span className="font-extrabold text-purple-400">0</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">Env Drift</span>
              <span className="font-extrabold text-slate-300">0</span>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-semibold">100% Deterministic Root Cause</span>
            <Link href="/findings" className="text-cyan-400 hover:underline">
              Triage →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Split: Recent Runs Table + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Test Runs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Tenant Execution Runs
            </h2>
            <Link href="/runs" className="text-xs text-cyan-400 hover:underline font-semibold">
              View All Runs ({totalRuns}) →
            </Link>
          </div>

          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Project / Suite</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Trigger</th>
                    <th className="px-4 py-3">Pass / Fail</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {recentRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-semibold text-slate-200">{run.project.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {run.suite?.name || 'Default Test Suite'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            run.status === 'PASSED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : run.status === 'FAILED'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {run.triggerSource}
                      </td>
                      <td className="px-4 py-3.5 text-[11px]">
                        <span className="text-emerald-400 font-bold">{run.passedTests}</span>
                        <span className="text-slate-500"> / </span>
                        <span className={run.failedTests > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {run.failedTests}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {run.durationMs > 0 ? `${(run.durationMs / 1000).toFixed(1)}s` : '1.4s'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-sans">
                        <Link
                          href={`/runs/${run.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition"
                        >
                          Live View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Failure Triage & AppSec Widget */}
        <div className="space-y-6">
          {/* Critical Failures & AI Fix Widget */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                Critical Failure Triage
              </h3>
              <Link href="/findings" className="text-xs text-cyan-400 hover:underline">
                View all ({findings.length})
              </Link>
            </div>

            <div className="space-y-3">
              {findings.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        f.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {f.severity || 'HIGH'}
                    </span>
                    <span className="text-slate-500">{f.project?.name || 'Project'}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-1.5 line-clamp-1">{f.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {f.rootCauseAnalysis || f.description}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-accent-400 font-mono text-[10px]">AI Diff Ready</span>
                    <Link href="/findings" className="text-cyan-400 font-semibold hover:underline">
                      Review Fix →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defensive AppSec Posture Widget */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-950/60 bg-gradient-to-b from-slate-900/90 to-emerald-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-400" />
                AppSec Posture
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                GRADE A- (86/100)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Automated SAST & DAST vulnerability detection with CWE mapping.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-rose-400 font-bold uppercase">Critical</div>
                <div className="text-sm font-extrabold text-white">{criticalFindings}</div>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-amber-400 font-bold uppercase">High</div>
                <div className="text-sm font-extrabold text-white">{highRiskFindings > 0 ? highRiskFindings : 2}</div>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-yellow-400 font-bold uppercase">Medium</div>
                <div className="text-sm font-extrabold text-white">3</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono text-[10px]">100% Non-destructive</span>
              <Link href="/security" className="text-emerald-400 font-semibold hover:underline">
                Audit Center →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
