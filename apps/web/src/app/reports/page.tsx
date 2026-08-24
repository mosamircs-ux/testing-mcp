'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  Layers,
  ShieldCheck,
  TrendingUp,
  FileCode2
} from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([
    {
      id: 'REP-2026-08',
      title: 'Monthly Enterprise QA & Release Health Executive Report',
      period: 'August 2026',
      totalRuns: 248,
      passRate: 95.8,
      securityGrade: 'A-',
      generatedAt: 'Today at 09:30 UTC',
      format: 'Markdown + PDF'
    },
    {
      id: 'REP-SPRINT-42',
      title: 'Sprint 42 Full Regression & Self-Healing Audit',
      period: 'Sprint 42 (Aug 10 - Aug 24)',
      totalRuns: 112,
      passRate: 97.2,
      securityGrade: 'A',
      generatedAt: 'Yesterday',
      format: 'HTML'
    },
    {
      id: 'REP-SEC-Q3',
      title: 'Q3 OWASP Top 10 & CWE Defensive Security Compliance',
      period: 'Q3 2026',
      totalRuns: 45,
      passRate: 91.5,
      securityGrade: 'A-',
      generatedAt: '3 days ago',
      format: 'PDF'
    }
  ]);

  const handleDownload = (id: string, format: string) => {
    alert(`Downloading report ${id} in ${format} format.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileText className="h-6 w-6 text-cyan-400" />
              Executive QA & Release Reports
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {reports.length} Reports
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Exportable executive summaries, release pass rates, regression metrics, and security audits.
          </p>
        </div>

        <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold">
          <Sparkles className="h-4 w-4" />
          Generate New Report
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((r) => (
          <div
            key={r.id}
            className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-6 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-cyan-400">{r.id}</span>
                <span className="text-slate-500">{r.period}</span>
              </div>

              <h2 className="text-base font-bold text-white leading-snug">{r.title}</h2>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Pass Rate</div>
                  <div className="text-emerald-400 font-extrabold mt-0.5">{r.passRate}%</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Security Grade</div>
                  <div className="text-cyan-400 font-extrabold mt-0.5">{r.securityGrade}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{r.generatedAt}</span>
              <button
                onClick={() => handleDownload(r.id, r.format)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition font-sans"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
