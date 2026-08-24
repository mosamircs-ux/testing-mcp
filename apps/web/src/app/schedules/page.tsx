'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Sparkles,
  GitBranch,
  Shield,
  X,
  Server,
  Zap
} from 'lucide-react';

interface ScheduleItem {
  id: string;
  name: string;
  suiteType: 'SMOKE' | 'REGRESSION' | 'SECURITY' | 'API' | 'CUSTOM';
  suiteName: string;
  frequencyPreset: 'EVERY_5_MINUTES' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
  cronExpression: string;
  humanReadable: string;
  targetEnv: string;
  isActive: boolean;
  lastRun: string;
  lastStatus: 'PASSED' | 'FAILED';
  nextRun: string;
}

export default function SchedulesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [scheduleName, setScheduleName] = useState('');
  const [suiteType, setSuiteType] = useState<'SMOKE' | 'REGRESSION' | 'SECURITY' | 'API' | 'CUSTOM'>('REGRESSION');
  const [frequencyPreset, setFrequencyPreset] = useState<'EVERY_5_MINUTES' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM'>('DAILY');
  const [customCron, setCustomCron] = useState('0 2 * * *');
  const [targetEnv, setTargetEnv] = useState('Staging Sandbox');

  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: 'SCHED-001',
      name: 'Every 5-Min Canary Smoke Sweep',
      suiteType: 'SMOKE',
      suiteName: 'Critical Auth & Checkout Smoke',
      frequencyPreset: 'EVERY_5_MINUTES',
      cronExpression: '*/5 * * * *',
      humanReadable: 'Every 5 minutes',
      targetEnv: 'Production Cluster',
      isActive: true,
      lastRun: '2 mins ago',
      lastStatus: 'PASSED',
      nextRun: 'in 3 mins'
    },
    {
      id: 'SCHED-002',
      name: 'Hourly API Contract & Schema Verification',
      suiteType: 'API',
      suiteName: 'API Gateway Regression',
      frequencyPreset: 'HOURLY',
      cronExpression: '0 * * * *',
      humanReadable: 'Hourly at minute 0',
      targetEnv: 'Production Staging',
      isActive: true,
      lastRun: '25 mins ago',
      lastStatus: 'PASSED',
      nextRun: 'in 35 mins'
    },
    {
      id: 'SCHED-003',
      name: 'Nightly Full Regression Suite',
      suiteType: 'REGRESSION',
      suiteName: 'Enterprise Full Regression',
      frequencyPreset: 'DAILY',
      cronExpression: '0 2 * * *',
      humanReadable: 'Daily at 02:00 UTC',
      targetEnv: 'Staging Sandbox',
      isActive: true,
      lastRun: '6 hours ago',
      lastStatus: 'PASSED',
      nextRun: 'in 18 hours'
    },
    {
      id: 'SCHED-004',
      name: 'Weekly Defensive SAST/DAST Security Audit',
      suiteType: 'SECURITY',
      suiteName: 'Defensive Security Suite',
      frequencyPreset: 'WEEKLY',
      cronExpression: '0 0 * * 0',
      humanReadable: 'Weekly on Sunday at midnight',
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

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    let cron = customCron;
    let humanReadable = 'Custom schedule';
    if (frequencyPreset === 'EVERY_5_MINUTES') {
      cron = '*/5 * * * *';
      humanReadable = 'Every 5 minutes';
    } else if (frequencyPreset === 'HOURLY') {
      cron = '0 * * * *';
      humanReadable = 'Hourly at minute 0';
    } else if (frequencyPreset === 'DAILY') {
      cron = '0 0 * * *';
      humanReadable = 'Daily at midnight UTC';
    } else if (frequencyPreset === 'WEEKLY') {
      cron = '0 0 * * 0';
      humanReadable = 'Weekly on Sunday at midnight';
    }

    const newItem: ScheduleItem = {
      id: `SCHED-${Math.floor(100 + Math.random() * 900)}`,
      name: scheduleName || `${suiteType} Automated Schedule`,
      suiteType,
      suiteName: `${suiteType.charAt(0) + suiteType.slice(1).toLowerCase()} Automated Suite`,
      frequencyPreset,
      cronExpression: cron,
      humanReadable,
      targetEnv,
      isActive: true,
      lastRun: 'Never',
      lastStatus: 'PASSED',
      nextRun: 'Scheduled'
    };

    setSchedules([...schedules, newItem]);
    setIsCreateModalOpen(false);
    setScheduleName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Calendar className="h-6 w-6 text-cyan-400" />
              Automated Continuous Schedules & Cron Triggers
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {schedules.length} Active Triggers
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Automated recurring triggers: Every 5 minutes, Hourly, Daily, Weekly, or Custom Cron across Smoke, Regression, Security, and API suites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings/ci-cd"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
            CI/CD Pipelines
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold"
          >
            <Plus className="h-4 w-4" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Preset Frequencies Overview Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-bold text-cyan-400 uppercase font-mono">Every 5 Min</div>
          <div className="text-xs font-bold text-white mt-1">Canary Smoke</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">*/5 * * * *</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Hourly</div>
          <div className="text-xs font-bold text-white mt-1">API Contract</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">0 * * * *</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-bold text-purple-400 uppercase font-mono">Daily</div>
          <div className="text-xs font-bold text-white mt-1">Full Regression</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">0 0 * * *</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-bold text-amber-400 uppercase font-mono">Weekly</div>
          <div className="text-xs font-bold text-white mt-1">Security Audit</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">0 0 * * 0</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Custom Cron</div>
          <div className="text-xs font-bold text-white mt-1">Custom Suite</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Flexible 5-Field</div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Schedule & Suite</th>
                <th className="px-3 py-3">Suite Type</th>
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
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {s.suiteName} • {s.humanReadable}
                    </div>
                  </td>

                  <td className="px-3 py-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        s.suiteType === 'SMOKE'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : s.suiteType === 'REGRESSION'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : s.suiteType === 'SECURITY'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {s.suiteType}
                    </span>
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

      {/* Modal: Create Schedule */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Configure Automated Test Schedule
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select suite, schedule frequency, and target environment.
              </p>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4 font-sans">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Schedule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nightly Production Regression"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Suite Type</label>
                  <select
                    value={suiteType}
                    onChange={(e) => setSuiteType(e.target.value as any)}
                    className="w-full mt-1 bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none"
                  >
                    <option value="SMOKE">Smoke suite</option>
                    <option value="REGRESSION">Regression suite</option>
                    <option value="SECURITY">Security suite</option>
                    <option value="API">API suite</option>
                    <option value="CUSTOM">Custom suite</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Schedule Frequency</label>
                  <select
                    value={frequencyPreset}
                    onChange={(e) => setFrequencyPreset(e.target.value as any)}
                    className="w-full mt-1 bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none"
                  >
                    <option value="EVERY_5_MINUTES">Every 5 minutes</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="CUSTOM">Custom cron</option>
                  </select>
                </div>
              </div>

              {frequencyPreset === 'CUSTOM' && (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Custom 5-Field Cron Expression</label>
                  <input
                    type="text"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="e.g. */15 * * * *"
                    className="w-full mt-1 bg-slate-950 text-xs text-cyan-400 p-3 rounded-lg border border-slate-800 outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Target Environment</label>
                <select
                  value={targetEnv}
                  onChange={(e) => setTargetEnv(e.target.value)}
                  className="w-full mt-1 bg-slate-950 text-xs text-white p-3 rounded-lg border border-slate-800 outline-none"
                >
                  <option value="Production Staging">Production Staging</option>
                  <option value="Staging Sandbox">Staging Sandbox</option>
                  <option value="Production Cluster">Production Cluster</option>
                  <option value="Development Node">Development Node</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
