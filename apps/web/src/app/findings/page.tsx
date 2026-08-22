import Link from 'next/link';
import { prisma } from '@novaqa/database';
import { Bug, Sparkles, CheckCircle2, ArrowUpRight, Cpu, Layers, GitPullRequest } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FindingsPage() {
  let findings: any[] = [];
  try {
    findings = await prisma.finding.findMany({
      include: {
        project: true,
        testRun: true,
        testResult: {
          include: { testCase: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error(err);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <Cpu className="h-6 w-6 text-accent-400" />
          AI Failure Diagnostics & Findings
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Autonomous root cause analysis, Bug vs Flake classification, self-healing selectors, and generated code patches.
        </p>
      </div>

      <div className="space-y-6">
        {findings.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No Open Findings</h3>
            <p className="text-xs text-slate-400 mt-1">All test suites are passing with zero detected regressions.</p>
          </div>
        ) : (
          findings.map((f) => (
            <div key={f.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                      f.severity === 'CRITICAL'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : f.severity === 'HIGH'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {f.severity} • {f.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Project: <strong className="text-slate-200">{f.project.name}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                    Status: {f.status}
                  </span>
                  <Link
                    href={`/runs/${f.testRunId}`}
                    className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    View Run →
                  </Link>
                </div>
              </div>

              {/* Title & Root Cause */}
              <div>
                <h3 className="text-base font-bold text-slate-100">{f.title}</h3>
                <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-2">
                  <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                    Autonomous Root Cause Analysis:
                  </div>
                  <p className="leading-relaxed">{f.rootCauseAnalysis}</p>
                </div>
              </div>

              {/* Suggested Fix & Unified Diff Patch */}
              {f.suggestedFix && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Actionable Remediation:</div>
                  <p className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    {f.suggestedFix}
                  </p>
                </div>
              )}

              {f.suggestedPatch && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <GitPullRequest className="h-3.5 w-3.5 text-accent-400" />
                    AI Generated Code Patch (Unified Git Diff):
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-900 whitespace-pre">
                    {f.suggestedPatch}
                  </pre>
                </div>
              )}

              {/* Auto Heal Selector */}
              {f.autoHealSelector && (
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-cyan-300">Self-Healing Selector Available:</span>
                    <div className="font-mono text-xs text-slate-200 mt-1">{f.autoHealSelector}</div>
                  </div>
                  <button
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-glow transition-all"
                  >
                    Apply Auto-Healing
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
