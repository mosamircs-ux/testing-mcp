'use client';

import React from 'react';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Sparkles,
  Zap,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function UsagePage() {
  const usageStats = {
    planName: 'Enterprise Dedicated Tier',
    billingCycle: 'Aug 1, 2026 - Aug 31, 2026',
    executionMinutesUsed: 4210,
    executionMinutesLimit: 10000,
    concurrencyUsed: 8,
    concurrencyLimit: 32,
    storageUsedGb: 14.8,
    storageLimitGb: 100,
    aiAnalysisTokensUsed: 840000,
    aiAnalysisTokensLimit: 5000000
  };

  const getPercent = (used: number, limit: number) => Math.round((used / limit) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Activity className="h-6 w-6 text-cyan-400" />
              Tenant Resource Usage & Quotas
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-bold">
              {usageStats.planName}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Current billing cycle: {usageStats.billingCycle} • Real-time consumption telemetry.
          </p>
        </div>

        <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-cyan-400" />
          Manage Subscription
        </button>
      </div>

      {/* Usage Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Execution Minutes */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Browser & Worker Execution Minutes</h2>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {getPercent(usageStats.executionMinutesUsed, usageStats.executionMinutesLimit)}%
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              style={{ width: `${getPercent(usageStats.executionMinutesUsed, usageStats.executionMinutesLimit)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{usageStats.executionMinutesUsed.toLocaleString()} mins used</span>
            <span>{usageStats.executionMinutesLimit.toLocaleString()} mins plan limit</span>
          </div>
        </div>

        {/* 2. Parallel Concurrency */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Parallel Worker Sandboxes</h2>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {usageStats.concurrencyUsed} / {usageStats.concurrencyLimit} Active
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              style={{ width: `${getPercent(usageStats.concurrencyUsed, usageStats.concurrencyLimit)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{usageStats.concurrencyUsed} concurrent sandboxes</span>
            <span>{usageStats.concurrencyLimit} max allocated</span>
          </div>
        </div>

        {/* 3. Artifact Storage */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Trace, Video & Screenshot Storage</h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {getPercent(usageStats.storageUsedGb, usageStats.storageLimitGb)}%
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              style={{ width: `${getPercent(usageStats.storageUsedGb, usageStats.storageLimitGb)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{usageStats.storageUsedGb} GB used</span>
            <span>{usageStats.storageLimitGb} GB quota</span>
          </div>
        </div>

        {/* 4. AI Failure Analysis Tokens */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">AI Failure Analysis & Patch Tokens</h2>
            </div>
            <span className="text-xs font-mono text-purple-400 font-bold">
              {getPercent(usageStats.aiAnalysisTokensUsed, usageStats.aiAnalysisTokensLimit)}%
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              style={{ width: `${getPercent(usageStats.aiAnalysisTokensUsed, usageStats.aiAnalysisTokensLimit)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{(usageStats.aiAnalysisTokensUsed / 1000).toFixed(0)}k tokens consumed</span>
            <span>{(usageStats.aiAnalysisTokensLimit / 1000000).toFixed(0)}M tokens limit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
