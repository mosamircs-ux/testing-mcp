'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileCheck
} from 'lucide-react';

const PHASES = [
  { id: 'STRUCTURE', label: '1. Structure & Manifests', desc: 'package.json, framework, build tool, dependencies' },
  { id: 'ROUTES', label: '2. Route & Navigation Crawler', desc: 'App router pages, forms, interactive buttons' },
  { id: 'API', label: '3. API & Schema Parser', desc: 'REST/GraphQL endpoints, request params, models' },
  { id: 'AUTH', label: '4. Auth & Role Mapping', desc: 'JWT, session cookies, RBAC matrix, tokens' },
  { id: 'WORKFLOWS', label: '5. Workflow & Feature Synthesizer', desc: 'Checkout, registration, CRUD journeys' },
  { id: 'RISKS', label: '6. Risk Area & Flakiness Detection', desc: 'Vulnerabilities, brittle selectors, race conditions' },
  { id: 'NORMALIZATION', label: '7. Normalized Spec (PRD) Compilation', desc: 'Unified JSON PRD specification & test suites' }
];

export default function DiscoveryPage({ params }: { params: { id: string } }) {
  const projectId = params.id;

  const [discoveryState, setDiscoveryState] = useState({
    status: 'COMPLETED',
    progress: 100,
    currentStep: 'COMPLETED',
    durationMs: 4200,
    logs: [
      { timestamp: '19:12:00', phase: 'INIT', message: 'Starting autonomous discovery sandbox...' },
      { timestamp: '19:12:01', phase: 'STRUCTURE', message: 'Detected Framework: Next.js 14 App Router (TypeScript, Node 20.x)' },
      { timestamp: '19:12:01', phase: 'ROUTES', message: 'Mapped 8 unique application web routes, layouts, and forms' },
      { timestamp: '19:12:02', phase: 'API', message: 'Discovered 8 structured REST endpoints with parameter schemas' },
      { timestamp: '19:12:02', phase: 'AUTH', message: 'Identified BEARER_JWT authentication with 5 RBAC permission roles' },
      { timestamp: '19:12:03', phase: 'WORKFLOWS', message: 'Synthesized 4 core feature domains and 2 critical user journeys' },
      { timestamp: '19:12:03', phase: 'RISKS', message: 'Flagged 3 risk areas (Flaky locators, IDOR boundaries)' },
      { timestamp: '19:12:04', phase: 'NORMALIZATION', message: 'Generated normalized project specification and synthesized test suites' },
      { timestamp: '19:12:04', phase: 'DONE', message: '✅ Autonomous discovery completed in 4.2s' }
    ]
  });

  const [isRunning, setIsRunning] = useState(false);

  const handleTriggerDiscovery = () => {
    setIsRunning(true);
    setDiscoveryState({
      status: 'IN_PROGRESS',
      progress: 10,
      currentStep: 'STRUCTURE',
      durationMs: 0,
      logs: [{ timestamp: new Date().toLocaleTimeString(), phase: 'INIT', message: 'Re-triggering autonomous discovery scan...' }]
    });

    let currentProg = 10;
    const interval = setInterval(() => {
      currentProg += 15;
      if (currentProg >= 100) {
        currentProg = 100;
        clearInterval(interval);
        setIsRunning(false);
        setDiscoveryState((prev) => ({
          ...prev,
          status: 'COMPLETED',
          progress: 100,
          currentStep: 'COMPLETED',
          logs: [
            ...prev.logs,
            { timestamp: new Date().toLocaleTimeString(), phase: 'DONE', message: '✅ Real-time autonomous discovery completed.' }
          ]
        }));
      } else {
        const activePhase = PHASES[Math.min(Math.floor((currentProg / 100) * PHASES.length), PHASES.length - 1)];
        setDiscoveryState((prev) => ({
          ...prev,
          progress: currentProg,
          currentStep: activePhase.id,
          logs: [
            ...prev.logs,
            { timestamp: new Date().toLocaleTimeString(), phase: activePhase.id, message: `Executing phase: ${activePhase.label}` }
          ]
        }));
      }
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Autonomous Discovery Console
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                discoveryState.status === 'COMPLETED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
              }`}
            >
              {discoveryState.status}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Project Discovery & Specification Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-engine AST scanner, route crawler, API parser, and AI specification generator.
          </p>
        </div>

        <button
          onClick={handleTriggerDiscovery}
          disabled={isRunning}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow flex items-center gap-1.5 transition-all self-start md:self-auto disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Discovery Running...' : 'Re-Run Discovery'}
        </button>
      </div>

      {/* Progress & Radar Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Phases Status */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Autonomous Discovery Phases ({discoveryState.progress}%)
            </h2>
            <span className="text-xs font-mono text-cyan-400">
              {discoveryState.status === 'COMPLETED' ? '4.2s Elapsed' : 'In Progress...'}
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-accent-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${discoveryState.progress}%` }}
            />
          </div>

          <div className="space-y-2.5 pt-2">
            {PHASES.map((phase, idx) => {
              const phaseProg = ((idx + 1) / PHASES.length) * 100;
              const isDone = discoveryState.progress >= phaseProg;
              const isCurrent = !isDone && discoveryState.progress >= ((idx) / PHASES.length) * 100;

              return (
                <div
                  key={phase.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isDone
                      ? 'bg-slate-900/40 border-slate-800 text-slate-200'
                      : isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-glow animate-pulse'
                      : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isDone ? 'text-emerald-400' : isCurrent ? 'text-cyan-400' : 'text-slate-600'}`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{phase.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{phase.desc}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold">
                    {isDone ? '100% COMPLETE' : isCurrent ? 'ANALYZING...' : 'QUEUED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick Links to Discovery Maps */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-cyan-400" />
            Synthesized Specifications
          </h2>
          <p className="text-xs text-slate-400">
            Discovery generated full interactive models ready for review and automated test execution:
          </p>

          <div className="space-y-2 pt-2">
            {[
              { href: 'map', label: 'Application Map', count: '1 Monolith / 4 Modules' },
              { href: 'routes', label: 'Discovered Routes', count: '8 Web Routes & Forms' },
              { href: 'apis', label: 'Discovered APIs', count: '8 REST Endpoints' },
              { href: 'features', label: 'Feature Domains', count: '4 Critical Domains' },
              { href: 'roles', label: 'RBAC Matrix', count: '5 Role Definitions' },
              { href: 'environments', label: 'Environments', count: 'Staging / Pre-Prod' }
            ].map((item) => (
              <Link
                key={item.href}
                href={`/projects/${projectId}/${item.href}`}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-all group"
              >
                <div>
                  <div className="font-semibold group-hover:text-cyan-300 transition-colors">{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.count}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Live Telemetry & Log Console */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Terminal className="h-4 w-4" />
            <span>Discovery Execution Logs</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Live SSE Stream Enabled</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-xs text-slate-300 space-y-1.5 max-h-64 overflow-y-auto">
          {discoveryState.logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-slate-500 select-none text-[11px]">[{log.timestamp}]</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 text-[10px] uppercase font-bold shrink-0">
                {log.phase}
              </span>
              <span className="text-slate-300 break-all">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
