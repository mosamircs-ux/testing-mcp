'use client';

import React, { useState } from 'react';
import { Shield, Smartphone, Laptop, Trash2, RefreshCw, KeyRound, CheckCircle2, Lock } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Chrome on macOS (Current)',
      ipAddress: '192.168.1.45',
      lastActive: 'Just now',
      isCurrent: true
    },
    {
      id: 'sess-2',
      device: 'VS Code Extension / Cursor MCP',
      ipAddress: '192.168.1.45',
      lastActive: '25 mins ago',
      isCurrent: false
    },
    {
      id: 'sess-3',
      device: 'Playwright Worker Sandbox',
      ipAddress: '10.0.4.12',
      lastActive: '2 hours ago',
      isCurrent: false
    }
  ]);

  const [message, setMessage] = useState<string | null>(null);

  const handleRevoke = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
    setMessage('Session revoked successfully.');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRevokeOthers = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    setMessage('All other active sessions have been invalidated.');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Security & Active Sessions</h1>
        <p className="text-sm text-slate-400 mt-1">Manage authentication security, session rotation, and active connected clients</p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Active Sessions */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Laptop className="h-4 w-4 text-cyan-400" />
                Active Sessions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Devices currently authenticated with session refresh tokens</p>
            </div>
            <button
              onClick={handleRevokeOthers}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/40 text-xs font-semibold transition-colors"
            >
              Terminate All Other Sessions
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {sessions.map((session) => (
              <div key={session.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      {session.device}
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>IP: {session.ipAddress}</span>
                      <span>•</span>
                      <span>Last active: {session.lastActive}</span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Revoke session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Controls & Session Rotation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-cyan-400" />
              Automatic Session Rotation
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Every time an access token is refreshed, the existing refresh token is invalidated and a cryptographically fresh one is issued to prevent replay attacks.
            </p>
            <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-semibold">
              Enforced & Active
            </span>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              Tenant Isolation Guard
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              All REST API queries and MCP agent operations are strictly partitioned by Organization ID with IDOR prevention middleware.
            </p>
            <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold">
              Strict Multi-Tenancy Guard Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
