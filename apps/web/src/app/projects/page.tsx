import Link from 'next/link';
import { prisma } from '@novaqa/database';
import { Layers, Plus, Globe, Code2, Server, Play, CheckCircle, ExternalLink, Sparkles, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      include: {
        environments: true,
        testSuites: {
          include: {
            testCases: {
              include: { steps: true }
            }
          }
        },
        discoveries: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: { select: { testRuns: true, findings: true, discoveries: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            Projects & Autonomous Discovery
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Manage your web applications, REST/GraphQL APIs, and mobile testing suites.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition-all inline-flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Create New Project (9-Step Wizard)
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => {
          const latestDiscovery = project.discoveries?.[0];
          return (
            <div key={project.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {project.category}
                      </span>
                      {latestDiscovery && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Discovered
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mt-2">{project.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{project.description || 'No description provided.'}</p>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-400">
                    {project.engineType}
                  </div>
                </div>

                {/* Environments */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Target Environments
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {project.environments.map((env: any) => (
                      <div
                        key={env.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2"
                      >
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>{env.name}</span>
                        <span className="text-slate-500 text-[10px]">({env.baseUrl})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suites */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Configured Test Suites ({project.testSuites.length})
                  </span>
                  <div className="space-y-2">
                    {project.testSuites.map((suite: any) => (
                      <div
                        key={suite.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{suite.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {suite.testCases.length} Test Cases
                          </div>
                        </div>

                        <Link
                          href={`/dashboard`}
                          className="px-3 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px] font-semibold hover:bg-cyan-900 transition-colors flex items-center gap-1"
                        >
                          <Play className="h-3 w-3 fill-cyan-400" />
                          Run
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                  <span>Runs: {project._count.testRuns}</span>
                  <span>•</span>
                  <span>Findings: {project._count.findings}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/${project.id}/discovery`}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Discovery Map
                  </Link>
                  <Link
                    href={`/projects/${project.id}/overview`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
