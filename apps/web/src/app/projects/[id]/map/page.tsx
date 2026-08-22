'use client';

import React from 'react';
import { Map, Layers, Cpu, Server, Globe, Database, Shield, ArrowRight } from 'lucide-react';

export default function ApplicationMapPage({ params }: { params: { id: string } }) {
  const modules = [
    {
      name: 'Authentication & Session Engine',
      domain: 'Identity & Access',
      type: 'Core Service',
      criticality: 'CRITICAL',
      desc: 'Bcrypt hashing, JWT short-lived tokens, SHA-256 session rotation, rate limiting',
      routes: ['/login', '/register', '/api/v1/auth/*'],
      color: 'border-cyan-800 bg-cyan-950/30'
    },
    {
      name: 'Product Catalog & Search Service',
      domain: 'Product & Business Logic',
      type: 'Feature Module',
      criticality: 'HIGH',
      desc: 'Product listing, category filtering, inventory checks, search indexing',
      routes: ['/', '/products', '/products/:slug', '/api/v1/products'],
      color: 'border-blue-800 bg-blue-950/30'
    },
    {
      name: 'Cart & Checkout Pipeline',
      domain: 'Transactional E-Commerce',
      type: 'Critical Path',
      criticality: 'CRITICAL',
      desc: 'Shopping cart state, coupon code discount calculation, payment authorization',
      routes: ['/checkout', '/api/v1/checkout', '/api/v1/coupons/apply'],
      color: 'border-purple-800 bg-purple-950/30'
    },
    {
      name: 'Telemetry & Auto-Healing Engine',
      domain: 'Platform Resilience',
      type: 'Testing Orchestrator',
      criticality: 'HIGH',
      desc: 'DOM snapshot capture, HAR logging, AI root-cause analysis, selector auto-healing',
      routes: ['/dashboard', '/findings', '/api/v1/runs/*', '/api/v1/findings/*'],
      color: 'border-emerald-800 bg-emerald-950/30'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Map className="h-3 w-3" />
              Application Architecture Map
            </span>
            <span className="text-xs text-slate-500 font-mono">Architecture: SSR Full-Stack Monolith</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Interactive Application Map</h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual topological representation of all discovered services, boundary components, and critical data flows.
          </p>
        </div>
      </div>

      {/* Visual Architecture Diagram */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          Component & Service Hierarchy
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border ${mod.color} space-y-3 transition-all hover:scale-[1.01]`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{mod.type}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{mod.name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  mod.criticality === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                }`}>
                  {mod.criticality}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{mod.desc}</p>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1.5">Discovered Entrypoints:</span>
                <div className="flex flex-wrap gap-1.5">
                  {mod.routes.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-mono">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
