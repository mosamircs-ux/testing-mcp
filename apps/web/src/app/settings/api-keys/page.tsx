'use client';

import React, { useState } from 'react';
import { Key, Plus, Copy, Check, Trash2, Shield, Calendar, Terminal, AlertTriangle } from 'lucide-react';

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState([
    {
      id: 'key-1',
      name: 'Acme CI/CD Pipeline & MCP Key',
      keyPrefix: 'nqa_live_acm',
      scope: 'ALL',
      projectName: 'All Projects',
      createdAt: '2026-08-22',
      lastUsed: '5 mins ago'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScope, setKeyScope] = useState('ALL');
  const [expiresIn, setExpiresIn] = useState('90');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const rawSecret = `nqa_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const newKey = {
      id: `key-${Date.now()}`,
      name: keyName,
      keyPrefix: rawSecret.substring(0, 12),
      scope: keyScope,
      projectName: keyScope === 'ALL' ? 'All Projects' : 'E-Commerce Storefront',
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };

    setKeys([newKey, ...keys]);
    setGeneratedSecret(rawSecret);
    setKeyName('');
  };

  const handleCopy = () => {
    if (generatedSecret) {
      navigator.clipboard.writeText(generatedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
    setMsg('API Key revoked.');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Project & MCP API Keys</h1>
          <p className="text-sm text-slate-400 mt-1">Manage project-scoped credentials for MCP clients (Cursor, Antigravity, Claude, Codex) and CI/CD</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setGeneratedSecret(null); }}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition-all flex items-center gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" />
          Create New API Key
        </button>
      </div>

      {msg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Keys Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="h-4 w-4 text-cyan-400" />
            Active API Credentials ({keys.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-800/60">
          {keys.map((k) => (
            <div key={k.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-400">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    {k.name}
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-mono">
                      {k.keyPrefix}...
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Scope: <strong className="text-slate-300">{k.projectName}</strong></span>
                    <span>•</span>
                    <span>Created: {k.createdAt}</span>
                    <span>•</span>
                    <span>Last used: {k.lastUsed}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  onClick={() => handleRevoke(k.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/30 text-rose-400 border border-rose-800/40 hover:bg-rose-900/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke Key
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl">
            {!generatedSecret ? (
              <>
                <h3 className="text-lg font-bold text-white mb-1">Create API Key</h3>
                <p className="text-xs text-slate-400 mb-4">Generate project-scoped credentials for MCP and automation</p>

                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Key Name / Description
                    </label>
                    <input
                      type="text"
                      required
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="e.g. Cursor IDE MCP Integration"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Project Scoping
                    </label>
                    <select
                      value={keyScope}
                      onChange={(e) => setKeyScope(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="ALL">All Organization Projects (Full Access)</option>
                      <option value="storefront">E-Commerce Storefront (Scoped)</option>
                      <option value="api">Order & Payment Gateway API (Scoped)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Expiration
                    </label>
                    <select
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="365">1 Year</option>
                      <option value="0">Never Expires</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow"
                    >
                      Generate API Key
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong className="block font-semibold">Important: Save this key now!</strong>
                    <span>For your security, we will never show this API key again. If you lose it, you must generate a new one.</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 mb-4">
                  <code className="text-xs font-mono text-cyan-300 break-all">{generatedSecret}</code>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                >
                  I have saved this key
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
