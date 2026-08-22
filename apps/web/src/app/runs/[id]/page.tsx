import Link from 'next/link';
import { prisma } from '@novaqa/database';
import { notFound } from 'next/navigation';
import { Activity, CheckCircle, XCircle, Clock, Terminal, Image, FileCode, Bug, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TestRunDetailPage({ params }: { params: { id: string } }) {
  const run = await prisma.testRun.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      suite: true,
      environment: true,
      results: {
        include: {
          testCase: { include: { steps: true } },
          artifacts: true,
          findings: true
        }
      },
      findings: true,
      artifacts: true
    }
  });

  if (!run) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to Console
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 font-mono">
              Run #{run.id.slice(-8)}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                run.status === 'PASSED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : run.status === 'FAILED'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
              }`}
            >
              {run.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Project: <strong className="text-slate-200">{run.project.name}</strong> • Environment: <span className="font-mono text-cyan-400">{run.environment.name}</span> ({run.environment.baseUrl})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/api/v1/runs/${run.id}/report/junit.xml`}
            target="_blank"
            className="px-3 py-1.5 rounded-lg glass-panel text-xs font-mono text-slate-300 hover:text-cyan-400 border border-slate-700"
          >
            Export JUnit XML
          </Link>
          <Link
            href={`/api/v1/runs/${run.id}/report/summary.md`}
            target="_blank"
            className="px-3 py-1.5 rounded-lg glass-panel text-xs font-mono text-slate-300 hover:text-cyan-400 border border-slate-700"
          >
            Export Markdown
          </Link>
        </div>
      </div>

      {/* Execution Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Total Test Cases</span>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{run.totalTests}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Passed / Failed</span>
          <div className="text-xl font-bold font-mono mt-1">
            <span className="text-emerald-400">{run.passedTests}</span> / <span className="text-rose-400">{run.failedTests}</span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Total Duration</span>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{(run.durationMs / 1000).toFixed(2)}s</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Captured Artifacts</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{run.artifacts.length} Files</div>
        </div>
      </div>

      {/* Main Split: Test Cases Timeline & Sandbox Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Step-by-Step Test Results */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Executed Test Cases
          </h2>

          <div className="space-y-4">
            {run.results.map((res) => {
              let parsedSteps: any[] = [];
              try {
                parsedSteps = typeof res.stepResults === 'string' ? JSON.parse(res.stepResults) : (res.stepResults as any) || [];
              } catch {
                parsedSteps = [];
              }

              return (
                <div
                  key={res.id}
                  className={`glass-panel p-5 rounded-2xl border transition-all ${
                    res.status === 'FAILED' ? 'border-rose-900/60 bg-rose-950/10' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {res.status === 'PASSED' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{res.testCase.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Category: <span className="font-mono text-slate-300">{res.testCase.category}</span> • Priority: <span className="font-mono text-cyan-400">{res.testCase.priority}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-400">{(res.durationMs / 1000).toFixed(2)}s</span>
                  </div>

                  {/* Steps Details */}
                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Step Execution Trace
                    </div>
                    <div className="space-y-1.5 font-mono text-xs">
                      {parsedSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            step.status === 'PASSED'
                              ? 'bg-slate-950/60 border-slate-900 text-slate-300'
                              : 'bg-rose-950/30 border-rose-900/50 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">#{step.order}</span>
                            <span className="font-bold text-cyan-400">{step.action}</span>
                            <span className="text-slate-300">{step.target || ''}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500">{step.durationMs}ms</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                step.status === 'PASSED' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error Log & Stack Trace */}
                  {res.errorMessage && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-rose-900/40 text-xs font-mono">
                      <div className="text-rose-400 font-bold mb-1">Execution Failure:</div>
                      <div className="text-slate-300">{res.errorMessage}</div>
                      {res.stackTrace && (
                        <pre className="mt-2 text-[11px] text-slate-500 overflow-x-auto whitespace-pre-wrap">
                          {res.stackTrace}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: AI Failure Diagnostics & Artifacts */}
        <div className="space-y-6">
          {/* AI Root Cause Card */}
          {run.findings.length > 0 && (
            <div className="glass-panel-glow p-5 rounded-2xl border border-cyan-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  AI Failure Diagnostics
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {run.findings[0].category}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-100">{run.findings[0].title}</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {run.findings[0].rootCauseAnalysis}
                </p>
              </div>

              {run.findings[0].suggestedPatch && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">Suggested Code Patch:</span>
                  <pre className="mt-1 p-3 rounded-lg bg-slate-950 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-900">
                    {run.findings[0].suggestedPatch}
                  </pre>
                </div>
              )}

              <Link
                href="/findings"
                className="block text-center py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-glow transition-all"
              >
                Apply Auto-Heal Selector
              </Link>
            </div>
          )}

          {/* Captured Artifacts List */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileCode className="h-4 w-4 text-cyan-400" />
              Captured Artifacts
            </h3>

            {run.artifacts.length === 0 ? (
              <p className="text-xs text-slate-500">No artifacts generated for this run.</p>
            ) : (
              <div className="space-y-2">
                {run.artifacts.map((art) => (
                  <div
                    key={art.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400">
                        {art.type}
                      </span>
                      <span className="text-slate-300 truncate">{art.fileName}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {(art.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
