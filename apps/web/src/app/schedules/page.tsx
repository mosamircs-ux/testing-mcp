'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Play,
  Plus,
  CheckCircle2,
  AlertCircle,
  Layers,
  Power,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([
    {
      id: 'SCHED-001',
      name: 'Nightly Full Regression Suite',
      suiteName: 'Enterprise Full Regression',
      cronExpression: '0 2 * * *',
      humanReadable: 'Every day at 02:00 UTC',
      targetEnv: 'Staging Sandbox',
      isActive: true,
      lastRun: '6 hours ago',
      lastStatus: 'PASSED',
      nextRun: 'in 18 hours'
    },
    {
      id: 'SCHED-002',
      name: 'Hourly Core Auth & Checkout Smoke',
      suiteName: 'Critical Smoke Suite',
      cronExpression: '0 * * * *',
      humanReadable: 'Every hour at minute 0',
      targetEnv: 'Production',
      isActive: true,
      lastRun: '15 mins ago',
      lastStatus: 'PASSED',
      nextRun: 'in 45 mins'
    },
    {
      id: 'SCHED-003',
      name: 'Weekly Defensive SAST/DAST Security Audit',
      suiteName: 'Defensive Security Suite',
      cronExpression: '0 0 * * 0',
      humanReadable: 'Every Sunday at midnight',
      targetEnv: 'Staging Sandbox',
      isActive: true,
      lastRun: '2 days ago',
      lastStatus: 'PASSED',
      nextRun: 'in 5 days'
    }
  ]);

  const toggleSchedule = (id: string) => {
    setSchedules(
      schedules.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Calendar className="h-6 w-6 text-cyan-400" />
              Automated Schedules & Cron Jobs
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {schedules.length} Active Cron Triggers
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Automated background regression runs, smoke checks, and scheduled security compliance audits.
          </p>
        </div>

        <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Create Schedule
        </button>
      </div>

      {/* Schedules Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Schedule Name</th>
                <th className="px-4 py-3">Suite Target</th>
                <th className="px-4 py-3">Cron Expression</th>
                <th className="px-4 py-3">Target Environment</th>
                <th className="px-4 py-3">Last Run Status</th>
                <th className="px-4 py-3">Next Trigger</th>
                <th className="px-4 py-3 text-right">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3.5 font-sans">
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{s.humanReadable}</div>
                  </td>

                  <td className="px-4 py-3.5 font-sans text-slate-300">
                    {s.suiteName}
                  </td>

                  <td className="px-4 py-3.5 text-cyan-400 font-bold">
                    {s.cronExpression}
                  </td>

                  <td className="px-4 py-3.5 font-sans text-slate-300">
                    {s.targetEnv}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {s.lastStatus} ({s.lastRun})
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                    {s.nextRun}
                  </td>

                  <td className="px-4 py-3.5 text-right font-sans">
                    <button
                      onClick={() => toggleSchedule(s.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        s.isActive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {s.isActive ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
