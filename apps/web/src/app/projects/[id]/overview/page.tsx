'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  Code2,
  Server,
  Globe,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const projectId = params.id;

  return (
    <div className="space-y-8">
      {/* Overview Hero Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold">
              WEB APPLICATION
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
              DISCOVERY COMPLETE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">E-Commerce Storefront & Payment Gateway</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Autonomous end-to-end shopping cart, customer checkout, and payments testing project.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/discovery`}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Discovery Logs
          </Link>
          <button className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow flex items-center gap-2 transition-all">
            <Play className="h-4 w-4 fill-slate-950" />
            Run Test Suite
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Discovered Routes</div>
          <div className="text-2xl font-extrabold text-white mt-1">8</div>
          <span className="text-[11px] text-cyan-400 font-mono mt-0.5 inline-block">Pages & Modal Dialogs</span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Discovered APIs</div>
          <div className="text-2xl font-extrabold text-white mt-1">8</div>
          <span className="text-[11px] text-cyan-400 font-mono mt-0.5 inline-block">REST Endpoints</span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Feature Domains</div>
          <div className="text-2xl font-extrabold text-white mt-1">4</div>
          <span className="text-[11px] text-cyan-400 font-mono mt-0.5 inline-block">Critical Modules</span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Identified Risks</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">3</div>
          <span className="text-[11px] text-slate-400 font-mono mt-0.5 inline-block">Mitigations Active</span>
        </div>
      </div>

      {/* Technology Stack Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Code2 className="h-4 w-4 text-cyan-400" />
          Detected Technology Stack
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-1">Framework</span>
            <span className="font-bold text-slate-200">Next.js 14 App Router</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-1">Language & Runtime</span>
            <span className="font-bold text-slate-200">TypeScript / Node.js 20.x</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-1">Database & ORM</span>
            <span className="font-bold text-slate-200">PostgreSQL / Prisma ORM</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 font-semibold block mb-1">Testing Harness</span>
            <span className="font-bold text-slate-200">Playwright Test & Vitest</span>
          </div>
        </div>
      </div>

      {/* Identified Risk Areas */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Identified Risk Areas & Recommendations
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 text-slate-300 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-300">Brittle Element Selectors in Checkout Form</strong>
              <p className="text-slate-400 mt-1">Dynamic CSS class selectors detected on primary submission buttons. Recommended to enforce data-testid attributes.</p>
              <span className="inline-block mt-2 font-mono text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Mitigation: Autonomous Self-Healing Active
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-slate-300 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-rose-300">Cross-Tenant IDOR Vulnerability Surface</strong>
              <p className="text-slate-400 mt-1">Ensuring /api/v1/projects/:id filters by req.auth.organizationId across all CRUD operations.</p>
              <span className="inline-block mt-2 font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Mitigation: Tenant Isolation Middleware Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
