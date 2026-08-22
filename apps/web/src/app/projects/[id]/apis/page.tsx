'use client';

import React, { useState } from 'react';
import { Server, Search, Lock, Unlock, Play, Code } from 'lucide-react';

const DISCOVERED_APIS = [
  {
    path: '/api/v1/auth/register',
    method: 'POST',
    summary: 'Register new user and create organization workspace',
    authRequired: false,
    params: [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'string (email)', required: true },
      { name: 'password', type: 'string (min 8)', required: true }
    ],
    statusCodes: [201, 400, 409]
  },
  {
    path: '/api/v1/auth/login',
    method: 'POST',
    summary: 'Authenticate credentials and issue session tokens',
    authRequired: false,
    params: [
      { name: 'email', type: 'string', required: true },
      { name: 'password', type: 'string', required: true }
    ],
    statusCodes: [200, 401, 429]
  },
  {
    path: '/api/v1/auth/refresh',
    method: 'POST',
    summary: 'Rotate session and issue new access & refresh tokens',
    authRequired: false,
    params: [{ name: 'refreshToken', type: 'string', required: true }],
    statusCodes: [200, 401]
  },
  {
    path: '/api/v1/projects',
    method: 'GET',
    summary: 'List tenant projects with configured test suites',
    authRequired: true,
    params: [],
    statusCodes: [200, 401, 403]
  },
  {
    path: '/api/v1/projects',
    method: 'POST',
    summary: 'Create a new testing project',
    authRequired: true,
    params: [
      { name: 'name', type: 'string', required: true },
      { name: 'category', type: 'string', required: true },
      { name: 'baseUrl', type: 'string (url)', required: false }
    ],
    statusCodes: [201, 400, 403]
  },
  {
    path: '/api/v1/runs',
    method: 'POST',
    summary: 'Dispatch an automated test execution run',
    authRequired: true,
    params: [
      { name: 'projectId', type: 'string', required: true },
      { name: 'environmentId', type: 'string', required: true }
    ],
    statusCodes: [202, 400, 403, 404]
  },
  {
    path: '/api/v1/findings',
    method: 'GET',
    summary: 'Query AI failure triage findings and self-healed selectors',
    authRequired: true,
    params: [],
    statusCodes: [200, 401]
  },
  {
    path: '/api/v1/api-keys',
    method: 'POST',
    summary: 'Generate project-scoped API key for MCP and CI/CD',
    authRequired: true,
    params: [
      { name: 'name', type: 'string', required: true },
      { name: 'scope', type: 'string', required: false }
    ],
    statusCodes: [201, 400, 403]
  }
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-950 text-blue-400 border-blue-800',
  POST: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  PUT: 'bg-amber-950 text-amber-400 border-amber-800',
  PATCH: 'bg-purple-950 text-purple-400 border-purple-800',
  DELETE: 'bg-rose-950 text-rose-400 border-rose-800'
};

export default function ApiMapPage({ params }: { params: { id: string } }) {
  const [search, setSearch] = useState('');

  const filteredApis = DISCOVERED_APIS.filter(
    (api) => api.path.toLowerCase().includes(search.toLowerCase()) || api.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Server className="h-3 w-3" />
              API Map & Specifications
            </span>
            <span className="text-xs text-slate-500 font-mono">{DISCOVERED_APIS.length} Endpoints Discovered</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Discovered API Endpoints</h1>
          <p className="text-xs text-slate-400 mt-1">
            Contract schemas, HTTP verbs, payload parameters, and authorization constraints.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search API endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Endpoints List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
        {filteredApis.map((api, idx) => (
          <div key={idx} className="p-6 hover:bg-slate-900/30 transition-colors space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${METHOD_COLORS[api.method]}`}>
                  {api.method}
                </span>
                <code className="text-sm font-mono text-slate-200 font-bold">{api.path}</code>
              </div>

              <div className="flex items-center gap-2">
                {api.authRequired ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Auth Required
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
                    <Unlock className="h-3 w-3" /> Public
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {api.statusCodes.map((code) => (
                    <span key={code} className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 text-[10px] font-mono">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300">{api.summary}</p>

            {api.params.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Body Parameters:</span>
                <div className="flex flex-wrap gap-2">
                  {api.params.map((p, pIdx) => (
                    <div key={pIdx} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
                      <span className="text-cyan-400">{p.name}</span>
                      <span className="text-slate-500">: {p.type}</span>
                      {p.required && <span className="text-rose-400 text-[10px] ml-1">*req</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
