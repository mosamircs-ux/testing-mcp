'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  Database,
  Smartphone,
  ShieldCheck,
  Wrench,
  Bot,
  GitBranch,
  FileCode2,
  Sparkles,
  Activity,
  CheckCircle2,
  ArrowRight,
  Cpu
} from 'lucide-react';

export default function FeaturesPage() {
  const features = [
    {
      title: 'Autonomous Application Discovery',
      description: 'Crawls frontend routes, discovers hidden state transitions, parses OpenAPI schemas, and maps full RBAC permission matrices with zero manual configuration.',
      icon: Globe,
      color: 'text-cyan-400',
      badge: 'DISCOVERY'
    },
    {
      title: 'Real Multi-Engine Sandboxes',
      description: 'Executes genuine end-to-end tests across isolated headless/headed Chromium, Firefox, WebKit, Android Emulators, and iOS Simulators. No mocked DOMs.',
      icon: Cpu,
      color: 'text-emerald-400',
      badge: 'EXECUTION'
    },
    {
      title: 'Deep AI Failure Root-Cause Analysis',
      description: 'Correlates DOM mutations, HAR network telemetry, browser console logs, and stack traces into 10 distinct failure categories (REAL_BUG, SELECTOR_DRIFT, TIMING_ISSUE, etc.).',
      icon: Sparkles,
      color: 'text-purple-400',
      badge: 'INTELLIGENCE'
    },
    {
      title: 'Autonomous Self-Healing Selectors',
      description: 'Automatically detects shifted locators and updates wait strategies during UI redesigns, eliminating maintenance tax without concealing genuine defects.',
      icon: Wrench,
      color: 'text-teal-400',
      badge: 'SELF-HEALING'
    },
    {
      title: 'Official Model Context Protocol (MCP) Server',
      description: 'Connects Antigravity IDE, Claude, and Cursor directly to the testing engine with 35 native tools for test planning, running, failure analysis, and auto-fixing.',
      icon: Bot,
      color: 'text-blue-400',
      badge: 'MCP PROTOCOL'
    },
    {
      title: 'Defensive Application Security Testing (DAST)',
      description: 'Continuously tests applications against OWASP Top 10 vulnerabilities, IDOR flaws, SSRF vectors, SQLi/XSS indicators, and JWT configuration issues.',
      icon: ShieldCheck,
      color: 'text-rose-400',
      badge: 'SECURITY'
    },
    {
      title: 'Mobile Cloud Grid (Android & iOS)',
      description: 'Runs real APK and IPA mobile binaries. Tests touch gestures, deep links, push notifications, offline mode recovery, and device permission dialogs.',
      icon: Smartphone,
      color: 'text-amber-400',
      badge: 'MOBILE'
    },
    {
      title: 'CI/CD Quality Gates & CLI',
      description: 'Integrate directly into GitHub Actions, GitLab CI, Jenkins, or webhooks. Enforce pass rate, failure severity, and code coverage policy thresholds.',
      icon: GitBranch,
      color: 'text-cyan-400',
      badge: 'CI/CD'
    },
    {
      title: 'Interactive Executive Reporting',
      description: 'Generates shareable read-only reports, side-by-side run comparisons (Run A vs Run B), visual diff regression logs, and exportable PDF/HTML/JSON dossiers.',
      icon: FileCode2,
      color: 'text-purple-400',
      badge: 'REPORTING'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
          <Sparkles className="h-3.5 w-3.5" />
          FULL-STACK AUTONOMOUS TESTING ENGINE
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Everything required to prove software correctness.
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          From unit and integration to multi-engine browser E2E, mobile emulators, and defensive DAST security scans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/40 hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <Icon className={`h-6 w-6 ${feat.color}`} />
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {feat.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div className="glass-panel p-10 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-slate-900 to-cyan-950/20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Ready to prove your application?</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Start testing your web apps, APIs, and mobile apps with the autonomous AI agent in under 2 minutes.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition"
        >
          Start Testing Free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
