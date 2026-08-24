'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, ShieldCheck, Zap, HeartHandshake, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
          <Cpu className="h-3.5 w-3.5" />
          OUR MISSION & PHILOSOPHY
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Build with speed. <span className="text-cyan-400">Ship with proof.</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          We believe the software industry is undergoing its greatest paradigm shift in history. As AI coding agents accelerate software creation by 100x, human engineers need an equally powerful autonomous testing agent to verify correctness.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/40">
          <div className="p-2 w-fit rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">Zero Hallucination Tolerance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We never fake or simulate test results. Real Playwright browsers, real mobile emulators, and real HTTP mutations prove software behavior with cryptographic and telemetry proof.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/40">
          <div className="p-2 w-fit rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">Autonomous Pair Programming</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            By exposing an official Model Context Protocol (MCP) server, we empower developer assistants (Antigravity IDE, Claude, Cursor) to verify their own code changes before submitting PRs.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/40">
          <div className="p-2 w-fit rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">Continuous Defensive Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Security cannot be an afterthought. We integrate OWASP boundary probing and DAST vulnerability scanning directly into the daily test execution lifecycle.
          </p>
        </div>
      </div>

      {/* Team / Architecture Statement */}
      <div className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/80 to-slate-950 space-y-4">
        <h2 className="text-2xl font-bold text-white">Engineered for High-Velocity Teams</h2>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          NovaQA was architected from the ground up as a cloud-native, multi-tenant quality platform. Powered by Playwright, Appium, SQLite/PostgreSQL, distributed worker queues, and deep failure classification models, our system provides an immutable audit trail of software correctness.
        </p>
        <div className="pt-4 flex items-center gap-4">
          <Link
            href="/register"
            className="px-6 py-3 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-1.5"
          >
            Join NovaQA <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Contact Engineering Team
          </Link>
        </div>
      </div>
    </div>
  );
}
