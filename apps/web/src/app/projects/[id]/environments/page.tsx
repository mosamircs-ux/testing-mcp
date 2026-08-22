'use client';

import React, { useState } from 'react';
import { Sliders, Plus, Globe, Check, Trash2, CheckCircle2 } from 'lucide-react';

interface EnvironmentItem {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  isDefault: boolean;
  variables: Record<string, string>;
  headers: Record<string, string>;
}

export default function EnvironmentsPage({ params }: { params: { id: string } }) {
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([
    {
      id: 'env-1',
      name: 'Staging Environment (Default)',
      slug: 'staging',
      baseUrl: 'http://localhost:3000',
      isDefault: true,
      variables: { NODE_ENV: 'staging', MOCK_STRIPE: 'true' },
      headers: { 'X-Tenant-Id': 'acme-corp' }
    },
    {
      id: 'env-2',
      name: 'Local Dev Cluster',
      slug: 'local',
      baseUrl: 'http://localhost:3000',
      isDefault: false,
      variables: { NODE_ENV: 'development' },
      headers: {}
    }
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newEnv: EnvironmentItem = {
      id: `env-${Date.now()}`,
      name: newName,
      slug: newName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      baseUrl: newUrl,
      isDefault: false,
      variables: {},
      headers: {}
    };
    setEnvironments([...environments, newEnv]);
    setShowAdd(false);
    setNewName('');
    setNewUrl('');
    setMsg('Environment added successfully.');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-3 w-3" />
              Target Environments
            </span>
            <span className="text-xs text-slate-500 font-mono">{environments.length} Configured</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Target Environments & Variables</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage target URLs, security headers, and execution variables for automated runs.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow flex items-center gap-1.5 transition-all self-start"
        >
          <Plus className="h-4 w-4" />
          Add Environment
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Environments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {environments.map((env) => (
          <div key={env.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">{env.name}</h3>
              </div>
              {env.isDefault && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono">
                  Default Target
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Base URL:</span>
              <code className="text-xs font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 block">
                {env.baseUrl}
              </code>
            </div>

            {Object.keys(env.variables).length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Variables:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(env.variables).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                      {k}={v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Target Environment</h3>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Environment Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. UAT Cluster"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Base URL
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://uat.example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-slate-950 hover:brightness-110"
                >
                  Save Environment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
