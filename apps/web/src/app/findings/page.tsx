import { prisma } from '@novaqa/database';
import { Cpu, CheckCircle2 } from 'lucide-react';
import { FindingCard } from './finding-card';

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
          <Cpu className="h-6 w-6 text-cyan-400" />
          AI Failure Diagnostics & Findings
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Autonomous root cause analysis across 10 failure categories, self-healing selectors, proposed code patches, and verification pipelines.
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
            <FindingCard key={f.id} finding={f} />
          ))
        )}
      </div>
    </div>
  );
}
