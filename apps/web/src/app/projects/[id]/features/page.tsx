'use client';

import React from 'react';
import { Activity, Shield, ShoppingBag, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    id: 'feat-auth',
    name: 'Authentication & Session Lifecycle',
    domain: 'Identity & Access',
    priority: 'P0_CRITICAL',
    desc: 'End-to-end identity management: registration, login, token rotation, logout, and password resets.',
    workflows: ['User Register', 'User Login', 'Token Refresh', 'Password Reset'],
    testCount: 6,
    icon: UserCheck
  },
  {
    id: 'feat-catalog',
    name: 'Core Catalog & Resource Discovery',
    domain: 'Product & Business Logic',
    priority: 'P1_HIGH',
    desc: 'Listing, searching, filtering, and querying core business resources.',
    workflows: ['Browse Catalog', 'Search with Filters', 'View Item Details'],
    testCount: 5,
    icon: ShoppingBag
  },
  {
    id: 'feat-transactions',
    name: 'Transactional State & Mutation Flows',
    domain: 'Checkout / CRUD Operations',
    priority: 'P0_CRITICAL',
    desc: 'Multi-step transactional mutations, cart additions, coupon validations, and checkout.',
    workflows: ['Add to Cart', 'Apply Coupon Code', 'Checkout Submission', 'Order Status Check'],
    testCount: 8,
    icon: Activity
  },
  {
    id: 'feat-security',
    name: 'Tenant Boundary & IDOR Guards',
    domain: 'Platform Security',
    priority: 'P0_CRITICAL',
    desc: 'Validation that cross-tenant resource accesses and unauthorized role mutations are blocked.',
    workflows: ['Cross-Org IDOR Attack Check', 'Privilege Escalation Check'],
    testCount: 4,
    icon: Shield
  }
];

export default function FeatureMapPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              Feature & Business Domain Map
            </span>
            <span className="text-xs text-slate-500 font-mono">4 Core Domains Discovered</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Synthesized Feature Modules</h1>
          <p className="text-xs text-slate-400 mt-1">
            Functional decomposition of key business capabilities and automated test scenarios.
          </p>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((feat) => {
          const Icon = feat.icon;
          return (
            <div key={feat.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{feat.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400">{feat.domain}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  feat.priority === 'P0_CRITICAL'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                }`}>
                  {feat.priority}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{feat.desc}</p>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Synthesized User Journeys:</span>
                  <span className="text-cyan-400 font-bold font-mono">{feat.testCount} Test Cases</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {feat.workflows.map((wf, wIdx) => (
                    <span key={wIdx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                      ✓ {wf}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
