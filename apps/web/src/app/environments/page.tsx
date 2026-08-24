'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  Globe,
  Plus,
  Key,
  CheckCircle2,
  Lock,
  ExternalLink,
  Shield,
  Trash2,
  Sparkles
} from 'lucide-react';

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState([
    {
      id: 'ENV-PROD',
      name: 'Production Environment',
      slug: 'production',
      baseUrl: 'https://app.acme.com',
      isDefault: true,
      variablesCount: 6,
      headersCount: 2,
      lastChecked: '2 mins ago',
      status: 'HEALTHY'
    },
    {
      id: 'ENV-STAGE',
      name: 'Staging Sandbox Cluster',
      slug: 'staging',
      baseUrl: 'https://staging.acme.com',
      isDefault: false,
      variablesCount: 8,
      headersCount: 3,
      lastChecked: '12 mins ago',
      status: 'HEALTHY'
    },
    {
      id: 'ENV-DEV',
      name: 'Local Dev Node Container',
      slug: 'development',
      baseUrl: 'http://localhost:3000',
      isDefault: false,
      variablesCount: 4,
      headersCount: 1,
      lastChecked: '1 hour ago',
      status: 'HEALTHY'
    },
    {
      id: 'ENV-PR-992',
      name: 'Ephemeral PR Preview #992',
      slug: 'pr-992',
      baseUrl: 'https://preview-pr-992.acme.dev',
      isDefault: false,
      variablesCount: 5,
      headersCount: 1,
      lastChecked: '35 mins ago',
      status: 'HEALTHY'
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Server className="h-6 w-6 text-cyan-400" />
              Target Execution Environments
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {environments.length} Registered
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage target hosts, authentication bearer tokens, environment secrets, and headers per tier.
          </p>
        </div>

        <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Add Environment
        </button>
      </div>

      {/* Environments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {environments.map((env) => (
          <div
            key={env.id}
            className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-6 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{env.id}</span>
                  {env.isDefault && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                      DEFAULT
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {env.status}
                </span>
              </div>

              <h2 className="text-lg font-bold text-white">{env.name}</h2>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-slate-300">
                <span className="truncate">{env.baseUrl}</span>
                <a href={env.baseUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase">Variables</span>
                  <div className="text-slate-200 mt-0.5">{env.variablesCount} Encrypted Secrets</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase">Headers</span>
                  <div className="text-slate-200 mt-0.5">{env.headersCount} Custom Directives</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Last verified: {env.lastChecked}</span>
              <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition">
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
