'use client';

import React, { useState } from 'react';
import { Navigation, Search, Lock, Unlock, ArrowUpRight, MousePointer, FormInput } from 'lucide-react';

const DISCOVERED_ROUTES = [
  {
    path: '/',
    name: 'Landing / Home Page',
    type: 'PAGE',
    authRequired: false,
    interactiveElements: [
      { type: 'LINK', selector: 'nav a[href="/login"]', desc: 'Navigate to login' },
      { type: 'BUTTON', selector: 'button[data-testid="primary-cta"]', desc: 'Primary onboarding CTA' }
    ]
  },
  {
    path: '/login',
    name: 'User Sign In Form',
    type: 'PAGE',
    authRequired: false,
    forms: [{ name: 'LoginForm', fields: ['email', 'password'], submitAction: 'Submit credentials' }],
    interactiveElements: [
      { type: 'INPUT', selector: 'input[type="email"]', desc: 'Email address input' },
      { type: 'INPUT', selector: 'input[type="password"]', desc: 'Password input' },
      { type: 'BUTTON', selector: 'button[type="submit"]', desc: 'Sign in submission button' }
    ]
  },
  {
    path: '/register',
    name: 'Account Registration',
    type: 'PAGE',
    authRequired: false,
    forms: [{ name: 'RegisterForm', fields: ['name', 'email', 'password', 'organizationName'], submitAction: 'Create workspace account' }]
  },
  {
    path: '/dashboard',
    name: 'Main Application Dashboard',
    type: 'PAGE',
    authRequired: true,
    requiredRole: 'MEMBER',
    interactiveElements: [
      { type: 'BUTTON', selector: 'button[data-testid="refresh-metrics"]', desc: 'Live telemetry refresh' },
      { type: 'LINK', selector: 'a[href="/settings"]', desc: 'Open settings' }
    ]
  },
  {
    path: '/checkout',
    name: 'Shopping Cart & Checkout Flow',
    type: 'PAGE',
    authRequired: true,
    forms: [{ name: 'PaymentForm', fields: ['cardNumber', 'cardExp', 'cardCvc', 'promoCode'], submitAction: 'Authorize payment' }],
    interactiveElements: [
      { type: 'BUTTON', selector: 'button[data-testid="apply-coupon-btn"]', desc: 'Apply discount coupon' },
      { type: 'BUTTON', selector: 'button[data-testid="submit-order-btn"]', desc: 'Confirm and pay order' }
    ]
  },
  {
    path: '/settings/profile',
    name: 'User Profile & Preferences',
    type: 'PAGE',
    authRequired: true
  },
  {
    path: '/settings/team',
    name: 'Team & RBAC Role Management',
    type: 'PAGE',
    authRequired: true,
    requiredRole: 'ADMIN'
  },
  {
    path: '/settings/api-keys',
    name: 'API Keys & MCP Credentials',
    type: 'PAGE',
    authRequired: true,
    requiredRole: 'ENGINEER'
  }
];

export default function RoutesMapPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAuth, setFilterAuth] = useState<'ALL' | 'PUBLIC' | 'PROTECTED'>('ALL');

  const filteredRoutes = DISCOVERED_ROUTES.filter((r) => {
    const matchesSearch = r.path.toLowerCase().includes(searchTerm.toLowerCase()) || r.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterAuth === 'PUBLIC') return matchesSearch && !r.authRequired;
    if (filterAuth === 'PROTECTED') return matchesSearch && r.authRequired;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="h-3 w-3" />
              Routes & UI Elements
            </span>
            <span className="text-xs text-slate-500 font-mono">{DISCOVERED_ROUTES.length} Discovered Routes</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Discovered Application Routes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated crawler inventory of web pages, layouts, discovered forms, and interactive buttons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search route or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
        {filteredRoutes.map((route, idx) => (
          <div key={idx} className="p-6 hover:bg-slate-900/30 transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <code className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {route.path}
                </code>
                <span className="text-sm font-semibold text-slate-200">{route.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {route.authRequired ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Protected ({route.requiredRole || 'Auth'})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
                    <Unlock className="h-3 w-3" />
                    Public Route
                  </span>
                )}
              </div>
            </div>

            {/* Forms / Elements */}
            {(route.forms || route.interactiveElements) && (
              <div className="pt-2 flex flex-wrap gap-4 text-xs">
                {route.forms?.map((form, fIdx) => (
                  <div key={fIdx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                    <span className="font-semibold text-cyan-400 flex items-center gap-1">
                      <FormInput className="h-3.5 w-3.5" />
                      {form.name}:
                    </span>
                    <span className="text-slate-400 ml-1">Fields: [{form.fields.join(', ')}]</span>
                  </div>
                ))}

                {route.interactiveElements?.map((el, eIdx) => (
                  <div key={eIdx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] flex items-center gap-1.5">
                    <MousePointer className="h-3.5 w-3.5 text-accent-400" />
                    <code className="text-accent-300 font-mono text-[10px]">{el.selector}</code>
                    <span className="text-slate-500">({el.desc})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
