'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Sparkles,
  Zap,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Users,
  Smartphone,
  Globe,
  FileCode2,
  Download,
  ArrowUpRight,
  TrendingUp,
  Shield,
  Layers,
  ChevronRight,
  Plus,
  X,
  Check,
  RotateCcw
} from 'lucide-react';

export default function UsageAndBillingDashboardPage() {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'PLANS' | 'INVOICES' | 'ADMIN'>('METRICS');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Dynamic Current Subscription State
  const [subscription, setSubscription] = useState({
    planSlug: 'PRO',
    planName: 'Professional Tier',
    status: 'active' as 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired',
    interval: 'monthly' as 'monthly' | 'yearly',
    priceMonthly: 7900,
    priceYearly: 79000,
    currentPeriodEnd: 'September 24, 2026',
    cancelAtPeriodEnd: false
  });

  // Dynamic Plans from Database
  const [plans, setPlans] = useState([
    {
      slug: 'FREE',
      name: 'Free Community Tier',
      priceMonthly: 0,
      priceYearly: 0,
      description: 'For individual developers and open-source contributors.',
      features: ['2 Projects', '100 Test Runs/mo', '50k AI Tokens', '120 Browser Mins', '1 GB Storage', '2 Team Members'],
      isCurrent: subscription.planSlug === 'FREE'
    },
    {
      slug: 'STARTER',
      name: 'Starter Tier',
      priceMonthly: 2900,
      priceYearly: 29000,
      description: 'For growing startup teams launching autonomous testing.',
      features: ['5 Projects', '1,000 Test Runs/mo', '500k AI Tokens', '1,000 Browser Mins', '60 Mobile Mins', '10 GB Storage', '5 Team Members'],
      isCurrent: subscription.planSlug === 'STARTER'
    },
    {
      slug: 'PRO',
      name: 'Professional Tier',
      priceMonthly: 7900,
      priceYearly: 79000,
      description: 'For agile engineering teams with continuous CI/CD releases.',
      features: ['15 Projects', '5,000 Test Runs/mo', '2M AI Tokens', '5,000 Browser Mins', '300 Mobile Mins', '50 GB Storage', '15 Team Members', 'Self-Healing Selectors'],
      isCurrent: subscription.planSlug === 'PRO',
      isPopular: true
    },
    {
      slug: 'TEAM',
      name: 'Team Collaborative Tier',
      priceMonthly: 19900,
      priceYearly: 199000,
      description: 'For multi-squad QA departments scaling cross-platform suites.',
      features: ['30 Projects', '15,000 Test Runs/mo', '5M AI Tokens', '15,000 Browser Mins', '1,000 Mobile Mins', '150 GB Storage', '30 Team Members', 'Defensive AppSec Posture'],
      isCurrent: subscription.planSlug === 'TEAM'
    },
    {
      slug: 'BUSINESS',
      name: 'Business Enterprise Tier',
      priceMonthly: 49900,
      priceYearly: 499000,
      description: 'For enterprise organizations with compliance and high throughput.',
      features: ['100 Projects', '50,000 Test Runs/mo', '20M AI Tokens', '50,000 Browser Mins', '5,000 Mobile Mins', '500 GB Storage', '100 Team Members', 'Full MCP Server Bridge'],
      isCurrent: subscription.planSlug === 'BUSINESS'
    },
    {
      slug: 'ENTERPRISE',
      name: 'Enterprise Dedicated Tier',
      priceMonthly: 99900,
      priceYearly: 999000,
      description: 'Custom infrastructure, unlimited scaling, and tailored SLA.',
      features: ['Unlimited Projects', 'Unlimited Runs', 'Unlimited AI Tokens', 'Unlimited Browser Mins', 'Unlimited Mobile Mins', '5 TB Storage', 'Unlimited Team Members', 'On-Premise Private Runners'],
      isCurrent: subscription.planSlug === 'ENTERPRISE'
    }
  ]);

  // 9 Tracked Resource Dimensions
  const [usageData, setUsageData] = useState({
    projects: { used: 4, limit: 15, unit: 'Projects', percent: 27 },
    testExecutions: { used: 1420, limit: 5000, unit: 'Runs', percent: 28 },
    aiTokens: { used: 840000, limit: 2000000, unit: 'Tokens', percent: 42 },
    browserMinutes: { used: 1650, limit: 5000, unit: 'Minutes', percent: 33 },
    apiRequests: { used: 18400, limit: 50000, unit: 'Requests', percent: 37 },
    mobileExecutionMinutes: { used: 84, limit: 300, unit: 'Minutes', percent: 28 },
    storage: { used: 14.8, limit: 50, unit: 'GB', percent: 30 },
    artifacts: { used: 2410, limit: 10000, unit: 'Files', percent: 24 },
    teamMembers: { used: 4, limit: 15, unit: 'Members', percent: 27 }
  });

  // Invoices & Payment History
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-2026-08',
      invoiceNumber: 'INV-2026-008',
      amount: 79.0,
      status: 'PAID',
      dueDate: 'Aug 24, 2026',
      paidAt: 'Aug 24, 2026',
      plan: 'Professional Tier (Monthly)'
    },
    {
      id: 'INV-2026-07',
      invoiceNumber: 'INV-2026-007',
      amount: 79.0,
      status: 'PAID',
      dueDate: 'Jul 24, 2026',
      paidAt: 'Jul 24, 2026',
      plan: 'Professional Tier (Monthly)'
    },
    {
      id: 'INV-2026-06',
      invoiceNumber: 'INV-2026-006',
      amount: 29.0,
      status: 'PAID',
      dueDate: 'Jun 24, 2026',
      paidAt: 'Jun 24, 2026',
      plan: 'Starter Tier (Monthly)'
    }
  ]);

  const handleSelectPlan = (planSlug: string) => {
    const selected = plans.find((p) => p.slug === planSlug);
    if (!selected) return;

    setSubscription({
      ...subscription,
      planSlug: selected.slug,
      planName: selected.name,
      priceMonthly: selected.priceMonthly,
      priceYearly: selected.priceYearly,
      status: 'active'
    });

    setIsUpgradeModalOpen(false);
    alert(`Successfully switched subscription to ${selected.name} (${billingInterval})!`);
  };

  const handleCancelSubscription = () => {
    setSubscription({
      ...subscription,
      cancelAtPeriodEnd: true
    });
    setIsCancelModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <CreditCard className="h-6 w-6 text-cyan-400" />
              SaaS Billing & 9-Dimension Resource Quotas
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                subscription.status === 'active'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {subscription.status}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Active Plan: <strong>{subscription.planName}</strong> • Next billing cycle renews on {subscription.currentPeriodEnd}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('METRICS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'METRICS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-4 w-4 text-cyan-400" />
          Resource Quotas (9 Dimensions)
        </button>
        <button
          onClick={() => setActiveTab('PLANS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'PLANS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4 text-purple-400" />
          Subscription Plans (6 Tiers)
        </button>
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'INVOICES' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="h-4 w-4 text-emerald-400" />
          Invoices & Payment History
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 9-DIMENSION USAGE & REMAINING QUOTA METRICS                        */}
      {/* ========================================================================= */}
      {activeTab === 'METRICS' && (
        <div className="space-y-6">
          {/* Current Subscription Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                Current Subscription Tier
              </span>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-white">{subscription.planName}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  ${(subscription.priceMonthly / 100).toFixed(2)} / month
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {subscription.cancelAtPeriodEnd
                  ? 'Your subscription is set to cancel at the end of the current billing period.'
                  : `Renews automatically on ${subscription.currentPeriodEnd}.`}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {subscription.cancelAtPeriodEnd ? (
                <button
                  onClick={() => setSubscription({ ...subscription, cancelAtPeriodEnd: false })}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition"
                >
                  Resume Subscription
                </button>
              ) : (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-slate-400 border border-slate-700 hover:text-rose-400 hover:border-rose-800 transition"
                >
                  Cancel Plan
                </button>
              )}
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
              >
                Change Plan
              </button>
            </div>
          </div>

          {/* 9 Resource Dimension Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Projects */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-cyan-400" /> Active Projects
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">{usageData.projects.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${usageData.projects.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{usageData.projects.used} used</span>
                <span>{usageData.projects.limit - usageData.projects.used} remaining (limit: {usageData.projects.limit})</span>
              </div>
            </div>

            {/* 2. Test Executions */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-400" /> Test Executions
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">{usageData.testExecutions.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${usageData.testExecutions.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{usageData.testExecutions.used.toLocaleString()} runs</span>
                <span>{(usageData.testExecutions.limit - usageData.testExecutions.used).toLocaleString()} remaining</span>
              </div>
            </div>

            {/* 3. AI Tokens */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-400" /> AI Diagnostic Tokens
                </span>
                <span className="text-xs font-mono text-purple-400 font-bold">{usageData.aiTokens.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: `${usageData.aiTokens.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{(usageData.aiTokens.used / 1000).toFixed(0)}k used</span>
                <span>{((usageData.aiTokens.limit - usageData.aiTokens.used) / 1000).toFixed(0)}k remaining</span>
              </div>
            </div>

            {/* 4. Browser Minutes */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-blue-400" /> Browser Execution Minutes
                </span>
                <span className="text-xs font-mono text-blue-400 font-bold">{usageData.browserMinutes.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${usageData.browserMinutes.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{usageData.browserMinutes.used} mins</span>
                <span>{usageData.browserMinutes.limit - usageData.browserMinutes.used} mins remaining</span>
              </div>
            </div>

            {/* 5. API Requests */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-teal-400" /> API Quality Requests
                </span>
                <span className="text-xs font-mono text-teal-400 font-bold">{usageData.apiRequests.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full" style={{ width: `${usageData.apiRequests.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{usageData.apiRequests.used.toLocaleString()} reqs</span>
                <span>{(usageData.apiRequests.limit - usageData.apiRequests.used).toLocaleString()} remaining</span>
              </div>
            </div>

            {/* 6. Mobile Execution Minutes */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-amber-400" /> Mobile Sandbox Minutes
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">{usageData.mobileExecutionMinutes.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${usageData.mobileExecutionMinutes.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{usageData.mobileExecutionMinutes.used} mins</span>
                <span>{usageData.mobileExecutionMinutes.limit - usageData.mobileExecutionMinutes.used} mins remaining</span>
              </div>
            </div>

            {/* 7. Storage */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-cyan-400" /> Trace & Artifact Storage
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">{usageData.storage.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${usageData.storage.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{usageData.storage.used} GB</span>
                <span>{(usageData.storage.limit - usageData.storage.used).toFixed(1)} GB remaining</span>
              </div>
            </div>

            {/* 8. Artifacts */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-emerald-400" /> Saved Test Artifacts
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">{usageData.artifacts.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${usageData.artifacts.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{usageData.artifacts.used.toLocaleString()} files</span>
                <span>{(usageData.artifacts.limit - usageData.artifacts.used).toLocaleString()} remaining</span>
              </div>
            </div>

            {/* 9. Team Members */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-purple-400" /> Team Seats Allocated
                </span>
                <span className="text-xs font-mono text-purple-400 font-bold">{usageData.teamMembers.percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: `${usageData.teamMembers.percent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{usageData.teamMembers.used} members</span>
                <span>{usageData.teamMembers.limit - usageData.teamMembers.used} seats remaining</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBSCRIPTION PLANS (6 TIERS)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'PLANS' && (
        <div className="space-y-6">
          {/* Interval Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingInterval === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 transition-colors relative"
            >
              <div
                className={`w-4 h-4 rounded-full bg-cyan-400 transition-transform ${
                  billingInterval === 'yearly' ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1 ${billingInterval === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
              Yearly Billing
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                2 MONTHS FREE
              </span>
            </span>
          </div>

          {/* 6 Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const price = billingInterval === 'yearly' ? p.priceYearly / 100 : p.priceMonthly / 100;

              return (
                <div
                  key={p.slug}
                  className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between space-y-6 shadow-xl relative ${
                    p.isCurrent
                      ? 'border-cyan-500 bg-cyan-950/10'
                      : p.isPopular
                      ? 'border-purple-500/80'
                      : 'border-slate-800'
                  }`}
                >
                  {p.isPopular && (
                    <span className="absolute -top-3 right-6 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono shadow">
                      MOST POPULAR
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">${price}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {p.priceMonthly === 0 ? 'forever' : billingInterval === 'yearly' ? '/ year' : '/ month'}
                      </span>
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(p.slug)}
                    disabled={p.isCurrent}
                    className={`w-full py-2.5 text-xs font-bold rounded-lg transition ${
                      p.isCurrent
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                        : 'bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow'
                    }`}
                  >
                    {p.isCurrent ? 'Current Active Tier' : `Upgrade to ${p.name.split(' ')[0]}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVOICES & PAYMENT HISTORY                                         */}
      {/* ========================================================================= */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Invoice Number</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Paid Date</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5 font-bold text-white">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3.5 font-sans text-slate-300">{inv.plan}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-100">${inv.amount.toFixed(2)}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{inv.paidAt}</td>
                      <td className="px-4 py-3.5 text-right font-sans">
                        <button
                          onClick={() => alert(`Downloading PDF receipt for ${inv.invoiceNumber}`)}
                          className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition inline-flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPGRADE MODAL                                                      */}
      {/* ========================================================================= */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl glass-panel rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Select Your Subscription Tier
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Dynamic pricing backed by enterprise database limits. Instant prorated upgrade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.slug}
                  className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
                    p.isCurrent ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{p.name}</h4>
                    <div className="text-2xl font-extrabold text-white mt-1">
                      ${billingInterval === 'yearly' ? p.priceYearly / 100 : p.priceMonthly / 100}
                      <span className="text-xs text-slate-400 font-mono font-normal"> /mo</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{p.description}</p>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(p.slug)}
                    disabled={p.isCurrent}
                    className={`w-full py-2 text-xs font-bold rounded-lg transition ${
                      p.isCurrent
                        ? 'bg-slate-800 text-slate-500 border border-slate-700'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                    }`}
                  >
                    {p.isCurrent ? 'Current Plan' : 'Select Tier'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCEL PLAN MODAL                                                  */}
      {/* ========================================================================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                Cancel Plan Subscription?
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                You will continue to have access to <strong>{subscription.planName}</strong> features until the end of your billing cycle on {subscription.currentPeriodEnd}.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 font-sans">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
