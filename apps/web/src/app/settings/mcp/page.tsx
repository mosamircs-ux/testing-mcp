import Link from 'next/link';
import { prisma } from '@novaqa/database';
import { Terminal, Key, Shield, Check, Copy, Cpu, ArrowRight, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function McpSettingsPage() {
  let apiKeys: any[] = [];
  try {
    apiKeys = await prisma.apiKey.findMany({
      include: { mcpSessions: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error(err);
  }

  const sampleCursorConfig = `{
  "mcpServers": {
    "novaqa": {
      "command": "node",
      "args": ["c:/Users/mohamedsamir/Documents/testing-mcp/apps/mcp/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/novaqa?schema=public",
        "AI_DEFAULT_PROVIDER": "mock"
      }
    }
  }
}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <Terminal className="h-6 w-6 text-cyan-400" />
          Model Context Protocol (MCP) Integration Hub
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Connect Cursor, Antigravity IDE, Claude, or Codex directly to NovaQA&apos;s autonomous testing engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Setup Instructions & Tool Index */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Setup Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              IDE Configuration (Cursor / Antigravity / Claude Desktop)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add NovaQA to your IDE&apos;s MCP configuration file (e.g. <code className="text-cyan-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">~/.cursor/mcp.json</code> or <code className="text-cyan-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">claude_desktop_config.json</code>).
            </p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 text-xs font-mono text-cyan-300 overflow-x-auto border border-slate-800">
                {sampleCursorConfig}
              </pre>
            </div>
          </div>

          {/* Exposed MCP Tools Index */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-100">Exposed MCP Tools</h2>
            <div className="space-y-3">
              {[
                { name: 'nova_list_projects', desc: 'Lists configured projects, test suites, and target environments.' },
                { name: 'nova_analyze_project', desc: 'Analyzes codebase or OpenAPI specs to discover critical workflows and endpoints.' },
                { name: 'nova_generate_test_plan', desc: 'Generates structured test scenarios from PRDs or feature requests.' },
                { name: 'nova_generate_test_code', desc: 'Generates executable Playwright TypeScript test cases.' },
                { name: 'nova_execute_test_run', desc: 'Executes automated tests in isolated sandboxes and returns summary.' },
                { name: 'nova_get_test_run_status', desc: 'Polls real-time step status, logs, and failure artifacts.' },
                { name: 'nova_analyze_failures', desc: 'AI Root Cause Analysis of test failures with Bug vs Flake classification.' },
                { name: 'nova_auto_heal_test', desc: 'Heals brittle element locators using live DOM inspection.' }
              ].map((tool, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 shrink-0">
                    {tool.name}
                  </span>
                  <p className="text-xs text-slate-400 leading-normal">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: API Keys & Sessions */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Key className="h-4 w-4 text-accent-400" />
                API Keys
              </h2>
              <button className="px-3 py-1 text-xs font-semibold rounded bg-cyan-500 text-slate-950 hover:brightness-110">
                + Create Key
              </button>
            </div>

            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div key={k.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{k.name}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">Active</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">{k.keyPrefix}••••••••••••••••</div>
                  <div className="text-[10px] text-slate-500">
                    Active sessions: {k.mcpSessions.length} ({k.mcpSessions.map((s: any) => s.clientName).join(', ') || 'None'})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
