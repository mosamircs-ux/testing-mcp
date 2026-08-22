import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Terminal, Shield, Play, Bug, Cpu, Layers, Key, Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'NovaQA | Production Autonomous AI Software Testing Platform',
  description: 'Autonomous AI Software Testing Orchestrator with Multi-Engine Sandboxes, Live Telemetry, Failure Analyzer, and Model Context Protocol (MCP) Bridge.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <Cpu className="h-5 w-5 text-slate-950 font-bold" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight flex items-center gap-1.5">
                  Nova<span className="text-cyan-400">QA</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                    MCP v1.0
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Autonomous Test Platform</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Layers className="h-4 w-4" />
                Projects
              </Link>
              <Link
                href="/findings"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Bug className="h-4 w-4" />
                AI Findings
              </Link>
              <Link
                href="/settings/mcp"
                className="px-3.5 py-1.5 text-sm font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/40 rounded-lg transition-colors flex items-center gap-2"
              >
                <Terminal className="h-4 w-4 text-cyan-400" />
                MCP Hub
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition-all flex items-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-slate-950" />
                Launch Suite
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 py-8 px-6 bg-slate-950/80 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">NovaQA Testing Engine</span>
              <span>•</span>
              <span>Next.js • Playwright • Redis • PostgreSQL • MCP Bridge</span>
            </div>
            <p>© 2026 NovaQA Inc. Production-grade autonomous quality platform.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
