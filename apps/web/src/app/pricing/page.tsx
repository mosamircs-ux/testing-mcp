'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Check,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Globe,
  Database,
  Smartphone,
  Layers,
  Activity,
  Terminal,
  FileCode2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface PlanLimitData {
  maxProjects: number;
  maxTestExecutions: number;
  maxAiTokens: number;
  maxBrowserMinutes: number;
  maxApiRequests: number;
  maxMobileMinutes: number;
  maxStorageGb: number;
  maxArtifacts: number;
  maxTeamMembers: number;
  retentionDays?: number;
  securityTesting?: string;
  ciCd?: string;
  mcp?: string;
  support?: string;
}

interface DatabasePlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number; // in cents
  priceYearly: number; // in cents
  currency: string;
  isActive: boolean;
  limits: string | PlanLimitData;
  features?: Array<{ id: string; name: string; description?: string }>;
}

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<DatabasePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Default fallback plans if network is initializing
  const fallbackPlans: DatabasePlan[] = [
    {
      id: 'plan_free',
      slug: 'FREE',
      name: 'Free Community Tier',
      description: 'For individual developers and open-source contributors.',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'USD',
      isActive: true,
      limits: {
        maxProjects: 2,
        maxTestExecutions: 100,
        maxAiTokens: 50000,
        maxBrowserMinutes: 120,
        maxApiRequests: 1000,
        maxMobileMinutes: 0,
        maxStorageGb: 1,
        maxArtifacts: 200,
        maxTeamMembers: 2,
        retentionDays: 7,
        securityTesting: 'None',
        ciCd: 'Manual & Webhook Triggers',
        mcp: 'Community (Core Tools)',
        support: 'Community Discord'
      }
    },
    {
      id: 'plan_starter',
      slug: 'STARTER',
      name: 'Starter Tier',
      description: 'For growing startup teams launching autonomous testing.',
      priceMonthly: 2900,
      priceYearly: 29000,
      currency: 'USD',
      isActive: true,
      limits: {
        maxProjects: 5,
        maxTestExecutions: 1000,
        maxAiTokens: 500000,
        maxBrowserMinutes: 1000,
        maxApiRequests: 10000,
        maxMobileMinutes: 60,
        maxStorageGb: 10,
        maxArtifacts: 2000,
        maxTeamMembers: 5,
        retentionDays: 30,
        securityTesting: 'Basic Vulnerability Checks',
        ciCd: 'GitHub Actions & GitLab CI',
        mcp: 'Full MCP Server (35 Tools)',
        support: 'Standard Email (< 24h)'
      }
    },
    {
      id: 'plan_pro',
      slug: 'PRO',
      name: 'Professional Tier',
      description: 'For agile engineering teams with continuous CI/CD releases.',
      priceMonthly: 7900,
      priceYearly: 79000,
      currency: 'USD',
      isActive: true,
      limits: {
        maxProjects: 15,
        maxTestExecutions: 5000,
        maxAiTokens: 2000000,
        maxBrowserMinutes: 5000,
        maxApiRequests: 50000,
        maxMobileMinutes: 300,
        maxStorageGb: 50,
        maxArtifacts: 10000,
        maxTeamMembers: 15,
        retentionDays: 90,
        securityTesting: 'OWASP Top 10 Defensive DAST',
        ciCd: 'Quality Gates, CLI & Pre-merge Blocking',
        mcp: 'Full MCP Server + Custom Tooling',
        support: 'Priority Email & Slack (< 4h)'
      }
    },
    {
      id: 'plan_team',
      slug: 'TEAM',
      name: 'Team Collaborative Tier',
      description: 'For multi-squad QA departments scaling cross-platform suites.',
      priceMonthly: 19900,
      priceYearly: 199000,
      currency: 'USD',
      isActive: true,
      limits: {
        maxProjects: 30,
        maxTestExecutions: 15000,
        maxAiTokens: 5000000,
        maxBrowserMinutes: 15000,
        maxApiRequests: 150000,
        maxMobileMinutes: 1000,
        maxStorageGb: 150,
        maxArtifacts: 30000,
        maxTeamMembers: 30,
        retentionDays: 180,
        securityTesting: 'Advanced Continuous AppSec Suite',
        ciCd: 'Parallel Grid Orchestration & Quality Gates',
        mcp: 'Full MCP Server + High-Concurrency Agents',
        support: 'Dedicated Slack & Priority SLA (< 2h)'
      }
    },
    {
      id: 'plan_business',
      slug: 'BUSINESS',
      name: 'Business Enterprise Tier',
      description: 'For enterprise organizations with compliance and high throughput.',
      priceMonthly: 49900,
      priceYearly: 499000,
      currency: 'USD',
      isActive: true,
      limits: {
        maxProjects: 100,
        maxTestExecutions: 50000,
        maxAiTokens: 20000000,
        maxBrowserMinutes: 50000,
        maxApiRequests: 500000,
        maxMobileMinutes: 5000,
        maxStorageGb: 500,
        maxArtifacts: 100000,
        maxTeamMembers: 100,
        retentionDays: 365,
        securityTesting: 'Full DAST/SAST + Custom RBAC Probes',
        ciCd: 'Enterprise Pipeline Quality Gate Matrix',
        mcp: 'Multi-Agent Distributed MCP Bridge',
        support: '24/7 Priority Support & TAM (< 1h)'
      }
    },
    {
      id: 'plan_enterprise',
      slug: 'ENTERPRISE',
      name: 'Enterprise Dedicated Tier',
      description: 'Custom infrastructure, unlimited scaling, and tailored SLA.',
      priceMonthly: 99900,
      priceYearly: 999000,
      currency: 'USD',
      isActive: true,
      limits: {
        maxProjects: -1,
        maxTestExecutions: -1,
        maxAiTokens: -1,
        maxBrowserMinutes: -1,
        maxApiRequests: -1,
        maxMobileMinutes: -1,
        maxStorageGb: 5000,
        maxArtifacts: -1,
        maxTeamMembers: -1,
        retentionDays: -1,
        securityTesting: 'Dedicated AppSec Scanner + Custom Compliance',
        ciCd: 'Private Runner Grids + Custom Webhooks',
        mcp: 'Dedicated Private MCP Infrastructure',
        support: '24/7 Phone, Solution Architect & 99.99% SLA'
      }
    }
  ];

  useEffect(() => {
    async function fetchPlansFromDatabase() {
      try {
        const res = await fetch('/api/v1/plans');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setPlans(json.data);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Using database seed plan fallbacks:', err);
      }
      setPlans(fallbackPlans);
      setIsLoading(false);
    }
    fetchPlansFromDatabase();
  }, []);

  const parseLimits = (limits: string | PlanLimitData): PlanLimitData => {
    if (typeof limits === 'string') {
      try {
        return JSON.parse(limits);
      } catch {
        return {} as PlanLimitData;
      }
    }
    return limits || ({} as PlanLimitData);
  };

  const formatLimit = (val: number | undefined, suffix = '', zeroLabel = 'None', unlimitedLabel = 'Unlimited') => {
    if (val === undefined || val === null) return '—';
    if (val === -1) return unlimitedLabel;
    if (val === 0) return zeroLabel;
    if (val >= 1000000) return `${val / 1000000}M ${suffix}`.trim();
    if (val >= 1000) return `${val / 1000}k ${suffix}`.trim();
    return `${val} ${suffix}`.trim();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
          <CreditCard className="h-3.5 w-3.5" />
          DATABASE-DRIVEN VALUE PRICING
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Transparent plans for modern engineering squads.
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Database-backed dynamic limits across all 15 resource and quality dimensions. Seamless Paymob Unified Checkout.
        </p>

        {/* Monthly / Yearly Switcher & Dynamic Savings Calculation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <div className="flex items-center gap-3 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                billingInterval === 'monthly'
                  ? 'bg-cyan-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                billingInterval === 'yearly'
                  ? 'bg-cyan-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Yearly Billing</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                2 MONTHS FREE
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Database Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const limits = parseLimits(plan.limits);
          const priceCents = billingInterval === 'yearly' ? plan.priceYearly : plan.priceMonthly;
          const displayPrice = (priceCents / 100).toFixed(0);

          // Dynamic Yearly Savings Calculation
          const annualCostMonthly = (plan.priceMonthly * 12) / 100;
          const annualCostYearly = plan.priceYearly / 100;
          const yearlySavingsDollars = annualCostMonthly - annualCostYearly;
          const isPopular = plan.slug === 'PRO';

          return (
            <div
              key={plan.slug}
              className={`glass-panel p-7 rounded-2xl border flex flex-col justify-between space-y-6 shadow-xl relative transition-all hover:border-slate-700 ${
                isPopular
                  ? 'border-cyan-500 bg-gradient-to-b from-cyan-950/20 to-slate-950 shadow-glow'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 right-6 text-[10px] font-bold px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 font-mono shadow">
                  RECOMMENDED
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed min-h-[32px]">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-white">${displayPrice}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {plan.priceMonthly === 0 ? 'forever' : billingInterval === 'yearly' ? '/ year' : '/ month'}
                    </span>
                  </div>

                  {billingInterval === 'yearly' && yearlySavingsDollars > 0 && (
                    <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                      ✓ Save ${yearlySavingsDollars.toFixed(0)} / year with annual plan
                    </div>
                  )}
                </div>

                {/* 15 Plan Dimensions List */}
                <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Included Quotas &amp; Capabilities
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 font-sans">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Test Executions:</span>
                      <span className="font-bold font-mono text-white">{formatLimit(limits.maxTestExecutions, '/ mo')}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">AI Diagnostic Tokens:</span>
                      <span className="font-bold font-mono text-cyan-400">{formatLimit(limits.maxAiTokens)}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Browser Minutes:</span>
                      <span className="font-bold font-mono text-white">{formatLimit(limits.maxBrowserMinutes, 'mins')}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">API Tests / Requests:</span>
                      <span className="font-bold font-mono text-white">{formatLimit(limits.maxApiRequests, 'reqs')}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Mobile Tests:</span>
                      <span className="font-bold font-mono text-purple-400">{formatLimit(limits.maxMobileMinutes, 'mins', 'None (Web only)')}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Active Projects:</span>
                      <span className="font-bold font-mono text-white">{formatLimit(limits.maxProjects)}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Team Seats:</span>
                      <span className="font-bold font-mono text-white">{formatLimit(limits.maxTeamMembers)}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Artifact Storage:</span>
                      <span className="font-bold font-mono text-white">{formatLimit(limits.maxStorageGb, 'GB')}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Data Retention:</span>
                      <span className="font-bold font-mono text-emerald-400">{formatLimit(limits.retentionDays, 'Days', '7 Days')}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Security Testing:</span>
                      <span className="font-semibold text-right text-slate-200 text-[11px]">{limits.securityTesting || 'None'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">CI/CD &amp; Quality Gates:</span>
                      <span className="font-semibold text-right text-slate-200 text-[11px]">{limits.ciCd || 'Webhook'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">MCP Protocol Access:</span>
                      <span className="font-semibold text-right text-cyan-300 text-[11px]">{limits.mcp || 'Community'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Support Level:</span>
                      <span className="font-semibold text-right text-slate-300 text-[11px]">{limits.support || 'Discord'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Flow Trigger CTA */}
              <Link
                href={`/checkout?plan=${plan.slug}&interval=${billingInterval}`}
                className={`w-full py-3.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 ${
                  isPopular
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                {plan.priceMonthly === 0 ? (
                  <span>Start Free Community</span>
                ) : (
                  <span>Select {plan.name.replace(' Tier', '')} &rarr;</span>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      {/* 15-Dimension Comparative Table */}
      <div className="space-y-6 pt-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase">DETAILED SPECIFICATION</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Compare All 15 Platform Dimensions</h2>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-xs text-slate-300 font-sans min-w-[760px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 font-mono">
              <tr>
                <th className="px-6 py-4">Dimension</th>
                <th className="px-4 py-4">Free</th>
                <th className="px-4 py-4">Starter</th>
                <th className="px-4 py-4 text-cyan-400 font-bold">Pro</th>
                <th className="px-4 py-4">Team</th>
                <th className="px-4 py-4">Business</th>
                <th className="px-4 py-4">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Monthly Price</td>
                <td className="px-4 py-3.5">$0</td>
                <td className="px-4 py-3.5">$29</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">$79</td>
                <td className="px-4 py-3.5">$199</td>
                <td className="px-4 py-3.5">$499</td>
                <td className="px-4 py-3.5">$999</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Yearly Price (2 mo. free)</td>
                <td className="px-4 py-3.5">$0</td>
                <td className="px-4 py-3.5">$290</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">$790</td>
                <td className="px-4 py-3.5">$1,990</td>
                <td className="px-4 py-3.5">$4,990</td>
                <td className="px-4 py-3.5">$9,990</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Test Executions / mo</td>
                <td className="px-4 py-3.5">100</td>
                <td className="px-4 py-3.5">1,000</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">5,000</td>
                <td className="px-4 py-3.5">15,000</td>
                <td className="px-4 py-3.5">50,000</td>
                <td className="px-4 py-3.5">Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">AI Diagnostic Tokens</td>
                <td className="px-4 py-3.5">50k</td>
                <td className="px-4 py-3.5">500k</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">2M</td>
                <td className="px-4 py-3.5">5M</td>
                <td className="px-4 py-3.5">20M</td>
                <td className="px-4 py-3.5">Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Browser Sandbox Minutes</td>
                <td className="px-4 py-3.5">120m</td>
                <td className="px-4 py-3.5">1,000m</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">5,000m</td>
                <td className="px-4 py-3.5">15,000m</td>
                <td className="px-4 py-3.5">50,000m</td>
                <td className="px-4 py-3.5">Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">API Test Requests</td>
                <td className="px-4 py-3.5">1,000</td>
                <td className="px-4 py-3.5">10,000</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">50,000</td>
                <td className="px-4 py-3.5">150,000</td>
                <td className="px-4 py-3.5">500,000</td>
                <td className="px-4 py-3.5">Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Mobile Test Minutes</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5">60m</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">300m</td>
                <td className="px-4 py-3.5">1,000m</td>
                <td className="px-4 py-3.5">5,000m</td>
                <td className="px-4 py-3.5">Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Active Projects</td>
                <td className="px-4 py-3.5">2</td>
                <td className="px-4 py-3.5">5</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">15</td>
                <td className="px-4 py-3.5">30</td>
                <td className="px-4 py-3.5">100</td>
                <td className="px-4 py-3.5">Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Team Member Seats</td>
                <td className="px-4 py-3.5">2</td>
                <td className="px-4 py-3.5">5</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">15</td>
                <td className="px-4 py-3.5">30</td>
                <td className="px-4 py-3.5">100</td>
                <td className="px-4 py-3.5">Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Artifact Storage</td>
                <td className="px-4 py-3.5">1 GB</td>
                <td className="px-4 py-3.5">10 GB</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">50 GB</td>
                <td className="px-4 py-3.5">150 GB</td>
                <td className="px-4 py-3.5">500 GB</td>
                <td className="px-4 py-3.5">5 TB</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Data Retention</td>
                <td className="px-4 py-3.5">7 Days</td>
                <td className="px-4 py-3.5">30 Days</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">90 Days</td>
                <td className="px-4 py-3.5">180 Days</td>
                <td className="px-4 py-3.5">365 Days</td>
                <td className="px-4 py-3.5">Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Defensive DAST Security</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5">Basic Checks</td>
                <td className="px-4 py-3.5 text-emerald-400">OWASP Top 10</td>
                <td className="px-4 py-3.5 text-emerald-400">Continuous Suite</td>
                <td className="px-4 py-3.5 text-emerald-400">Full DAST/SAST</td>
                <td className="px-4 py-3.5 text-emerald-400">Dedicated Scanner</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">CI/CD &amp; CLI Gates</td>
                <td className="px-4 py-3.5">Webhooks</td>
                <td className="px-4 py-3.5">GitHub / GitLab</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">Quality Gates + CLI</td>
                <td className="px-4 py-3.5">Parallel Grids</td>
                <td className="px-4 py-3.5">Enterprise Matrix</td>
                <td className="px-4 py-3.5">Private Runners</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Model Context Protocol (MCP)</td>
                <td className="px-4 py-3.5">Core Tools</td>
                <td className="px-4 py-3.5">35 Native Tools</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">35 Tools + Custom</td>
                <td className="px-4 py-3.5">High Concurrency</td>
                <td className="px-4 py-3.5">Distributed Bridge</td>
                <td className="px-4 py-3.5">Private MCP Grid</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Support SLA</td>
                <td className="px-4 py-3.5">Discord</td>
                <td className="px-4 py-3.5">Email (&lt; 24h)</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">Slack/Email (&lt; 4h)</td>
                <td className="px-4 py-3.5">Priority (&lt; 2h)</td>
                <td className="px-4 py-3.5">TAM (&lt; 1h)</td>
                <td className="px-4 py-3.5">24/7 Dedicated (99.99%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
