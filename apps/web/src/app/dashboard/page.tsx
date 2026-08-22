import Link from 'next/link';
import { prisma } from '@novaqa/database';
import { Play, Activity, CheckCircle, XCircle, AlertTriangle, Clock, ArrowUpRight, Cpu, Layers, Terminal, Sparkles, Building, Users, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let organizations: any[] = [];
  let projects: any[] = [];
  let recentRuns: any[] = [];
  let findings: any[] = [];

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
        take: 4
      });
    }
  } catch (err) {
    console.error('Failed to load dashboard data from database:', err);
  }

  const totalRuns = recentRuns.length;
  const passedRuns = recentRuns.filter((r) => r.status === 'PASSED').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;
  const openFindingsCount = findings.filter((f) => f.status === 'OPEN').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Header with Tenant Workspace Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-cyan-400" />
              Active Workspace
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-bold">
              ENTERPRISE TIER
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Acme Corporation
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Role: OWNER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/settings/team"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            Manage Team
          </Link>
          <Link
            href="/settings/mcp"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            MCP Client
          </Link>
          <Link
            href="/projects"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition-all flex items-center gap-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-slate-950" />
            Run Suite
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pass Rate</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-2">
            {passRate}%
          </div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 inline-block">
            Across active test suites
          </span>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tenant Executions</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-2">
            {totalRuns}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            Captured with full telemetry
          </span>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Open AI Findings</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
            {openFindingsCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            Require review or patch
          </span>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Self-Healed Tests</span>
            <Sparkles className="h-4 w-4 text-accent-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-accent-400 mt-2">
            1
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            Selector drifts recovered
          </span>
        </div>
      </div>

      {/* Main Content Grid: Projects & Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Runs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Tenant Test Runs
            </h2>
            <span className="text-xs text-slate-400">Live Telemetry Stream Enabled</span>
          </div>

          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Project / Suite</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Pass / Fail</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">{run.project.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {run.suite?.name || 'Default Suite'}
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
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                        {run.triggerSource}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold">{run.passedTests}</span>
                        <span className="text-slate-500"> / </span>
                        <span className={run.failedTests > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {run.failedTests}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                        {(run.durationMs / 1000).toFixed(1)}s
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/runs/${run.id}`}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          Inspect <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: AI Findings & Projects */}
        <div className="space-y-6">
          {/* AI Findings Card */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-accent-400" />
                AI Failure Triage
              </h2>
              <Link href="/findings" className="text-xs text-cyan-400 hover:underline">
                View all ({findings.length})
              </Link>
            </div>

            <div className="space-y-3">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-accent-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                      {f.category}
                    </span>
                    <span className="text-slate-500">{f.project.name}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2 line-clamp-1">{f.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{f.rootCauseAnalysis}</p>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-accent-400 font-medium">Patch Generated</span>
                    <Link href={`/findings`} className="text-cyan-400 font-semibold hover:underline">
                      Review Diff →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                Tenant Projects
              </h2>
              <Link href="/projects" className="text-xs text-cyan-400 hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {p.category} • {p.engineType}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {p.testSuites.length} Suites
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
