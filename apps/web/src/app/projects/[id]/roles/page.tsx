'use client';

import React from 'react';
import { Shield, Check, X, Info } from 'lucide-react';

const ROLES = [
  {
    role: 'OWNER',
    desc: 'Full administrative tenant authority including deletion, member roles, and billing.',
    routes: ['All Routes (*)'],
    endpoints: ['All Endpoints (*)'],
    badge: 'bg-rose-950 text-rose-300 border-rose-800'
  },
  {
    role: 'ADMIN',
    desc: 'Project, suite, and member management with billing read-only access.',
    routes: ['/dashboard', '/projects/*', '/settings/team', '/settings/api-keys'],
    endpoints: ['/api/v1/projects/*', '/api/v1/team/*', '/api/v1/runs/*'],
    badge: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  {
    role: 'QA_ENGINEER',
    desc: 'Test case generation, suite execution, finding triage, and auto-healing triggers.',
    routes: ['/dashboard', '/projects/*', '/findings', '/settings/api-keys'],
    endpoints: ['/api/v1/projects/*', '/api/v1/runs/*', '/api/v1/findings/*'],
    badge: 'bg-cyan-950 text-cyan-300 border-cyan-800'
  },
  {
    role: 'DEVELOPER',
    desc: 'Feature development testing, suite creation, and test execution.',
    routes: ['/dashboard', '/projects/*', '/runs/*'],
    endpoints: ['/api/v1/projects', '/api/v1/runs'],
    badge: 'bg-blue-950 text-blue-300 border-blue-800'
  },
  {
    role: 'VIEWER',
    desc: 'Read-only visibility into test executions and findings.',
    routes: ['/dashboard', '/projects', '/runs/*', '/findings'],
    endpoints: ['GET /api/v1/projects', 'GET /api/v1/runs/*', 'GET /api/v1/findings'],
    badge: 'bg-slate-800 text-slate-300 border-slate-700'
  }
];

export default function RolesMapPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Role & Permission Matrix
            </span>
            <span className="text-xs text-slate-500 font-mono">5 RBAC Roles Configured</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Discovered RBAC Authorization Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access boundary rules verified across REST API routes and application views.
          </p>
        </div>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLES.map((role) => (
          <div key={role.role} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${role.badge}`}>
                {role.role}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">{role.desc}</p>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Allowed Routes:</span>
                <div className="flex flex-wrap gap-1">
                  {role.routes.map((r, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[10px]">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Allowed Endpoints:</span>
                <div className="flex flex-wrap gap-1">
                  {role.endpoints.map((ep, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[10px]">
                      {ep}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
