'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Terminal,
  BookOpen,
  Code2,
  GitBranch,
  Bot,
  Shield,
  Layers,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<'QUICKSTART' | 'CLI' | 'MCP' | 'CICD' | 'SECURITY' | 'API'>('QUICKSTART');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(code);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row gap-8">
      {/* Sidebar Docs Nav */}
      <aside className="w-full md:w-64 space-y-4 shrink-0">
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Documentation Index
          </span>
          <nav className="space-y-0.5 text-xs font-semibold">
            {[
              { id: 'QUICKSTART', label: '1. Quickstart Guide', icon: Terminal },
              { id: 'CLI', label: '2. CLI Tooling Reference', icon: Code2 },
              { id: 'MCP', label: '3. AI Agent MCP Bridge', icon: Bot },
              { id: 'CICD', label: '4. CI/CD & Quality Gates', icon: GitBranch },
              { id: 'SECURITY', label: '5. Defensive DAST Probing', icon: Shield },
              { id: 'API', label: '6. REST API Specification', icon: Layers }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Docs Content */}
      <div className="flex-1 space-y-8 glass-panel p-6 md:p-10 rounded-2xl border border-slate-800 bg-slate-950/60">
        {/* =================================================================== */}
        {/* SECTION: QUICKSTART                                                 */}
        {/* =================================================================== */}
        {activeSection === 'QUICKSTART' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400">GETTING STARTED</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Autonomous Testing in 2 Minutes</h1>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Learn how to discover your application, generate complete end-to-end scenarios, and execute tests across headless Playwright sandboxes using the NovaQA CLI.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Step 1: Install NovaQA CLI</h3>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-400 flex items-center justify-between">
                <code>npm install -g @novaqa/cli</code>
                <button onClick={() => handleCopy('npm install -g @novaqa/cli')} className="text-slate-400 hover:text-white">
                  {copiedText === 'npm install -g @novaqa/cli' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Step 2: Initialize & Discover Project</h3>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-400 flex items-center justify-between">
                <code>testing-platform project init &amp;&amp; testing-platform discover</code>
                <button onClick={() => handleCopy('testing-platform project init && testing-platform discover')} className="text-slate-400 hover:text-white">
                  {copiedText === 'testing-platform project init && testing-platform discover' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                NovaQA inspects your directory, discovers Next.js/Vite/Express routes, forms, API contracts, and synthesizes an internal Product Specification document.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Step 3: Execute Autonomous Test Suite</h3>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-400 flex items-center justify-between">
                <code>testing-platform test --suite regression --security</code>
                <button onClick={() => handleCopy('testing-platform test --suite regression --security')} className="text-slate-400 hover:text-white">
                  {copiedText === 'testing-platform test --suite regression --security' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION: CLI REFERENCE                                              */}
        {/* =================================================================== */}
        {activeSection === 'CLI' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-purple-400">CLI TOOLING</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">testing-platform Command Reference</h1>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold">$ testing-platform project init</span>
                <p className="text-slate-300 font-sans">Initializes `.novaqa/config.json` with local workspace environment settings.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold">$ testing-platform discover</span>
                <p className="text-slate-300 font-sans">Autonomous static & runtime discovery of endpoints, forms, state transitions, and RBAC roles.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold">$ testing-platform test [--suite &lt;name&gt;] [--security]</span>
                <p className="text-slate-300 font-sans">Executes test run against local dev server or live URL, with optional OWASP defensive DAST scan.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold">$ testing-platform report [--format html|json|pdf]</span>
                <p className="text-slate-300 font-sans">Generates executive summary, pass/fail matrices, and failure root-cause analysis report.</p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION: MCP BRIDGE                                                 */}
        {/* =================================================================== */}
        {activeSection === 'MCP' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-teal-400">AI AGENT INTEGRATION</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Model Context Protocol (MCP) Server</h1>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Connect AI coding assistants directly to NovaQA via the official 35-tool MCP bridge.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Example Antigravity / Claude MCP Configuration:</h3>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
{`{
  "mcpServers": {
    "novaqa": {
      "command": "node",
      "args": ["/path/to/apps/mcp/dist/index.js"],
      "env": {
        "NOVAQA_API_KEY": "nqa_live_xxx",
        "NOVAQA_API_URL": "https://api.novaqa.io"
      }
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION: CI/CD & GATES                                              */}
        {/* =================================================================== */}
        {activeSection === 'CICD' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400">PIPELINES</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">CI/CD Quality Gates & Webhooks</h1>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">GitHub Actions Workflow (`.github/workflows/novaqa.yml`):</h3>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
{`name: NovaQA Continuous Quality Gate
on: [pull_request, push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run NovaQA Autonomous Suite
        run: |
          npx @novaqa/cli test --suite regression --security
        env:
          NOVAQA_API_KEY: \${{ secrets.NOVAQA_API_KEY }}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
