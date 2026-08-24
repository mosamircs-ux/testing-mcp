'use client';

import React, { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: 'Free Community',
      slug: 'FREE',
      priceMonthly: 0,
      priceYearly: 0,
      description: 'For individual developers and open-source projects.',
      features: [
        '2 Active Projects',
        '100 Autonomous Test Runs / mo',
        '50k AI Diagnostic Tokens',
        '120 Browser Sandbox Minutes',
        '1 GB Artifact Storage',
        '2 Team Member Seats',
        'Standard Community Support'
      ]
    },
    {
      name: 'Starter',
      slug: 'STARTER',
      priceMonthly: 29,
      priceYearly: 290,
      description: 'For growing startup squads launching continuous quality.',
      features: [
        '5 Active Projects',
        '1,000 Autonomous Test Runs / mo',
        '500k AI Diagnostic Tokens',
        '1,000 Browser Sandbox Minutes',
        '60 Mobile Emulator Minutes',
        '10 GB Artifact Storage',
        '5 Team Member Seats',
        'CLI & GitHub Actions Integration'
      ]
    },
    {
      name: 'Professional',
      slug: 'PRO',
      priceMonthly: 79,
      priceYearly: 790,
      description: 'For agile engineering teams with daily CI/CD release cycles.',
      features: [
        '15 Active Projects',
        '5,000 Autonomous Test Runs / mo',
        '2M AI Diagnostic Tokens',
        '5,000 Browser Sandbox Minutes',
        '300 Mobile Emulator Minutes',
        '50 GB Artifact Storage',
        '15 Team Member Seats',
        'Self-Healing Selectors Engine',
        'Model Context Protocol (MCP) Server'
      ],
      isPopular: true
    },
    {
      name: 'Team',
      slug: 'TEAM',
      priceMonthly: 199,
      priceYearly: 1990,
      description: 'For multi-squad QA departments scaling cross-platform suites.',
      features: [
        '30 Active Projects',
        '15,000 Autonomous Test Runs / mo',
        '5M AI Diagnostic Tokens',
        '15,000 Browser Sandbox Minutes',
        '1,000 Mobile Emulator Minutes',
        '150 GB Artifact Storage',
        '30 Team Member Seats',
        'Defensive AppSec DAST Scanner',
        'Continuous Cron Scheduler Quality Gates'
      ]
    },
    {
      name: 'Business',
      slug: 'BUSINESS',
      priceMonthly: 499,
      priceYearly: 4990,
      description: 'For enterprise organizations with high concurrency and compliance.',
      features: [
        '100 Active Projects',
        '50,000 Autonomous Test Runs / mo',
        '20M AI Diagnostic Tokens',
        '50,000 Browser Sandbox Minutes',
        '5,000 Mobile Emulator Minutes',
        '500 GB Artifact Storage',
        '100 Team Member Seats',
        'Custom Webhooks & Audit Logs Export',
        'Dedicated Priority Support'
      ]
    },
    {
      name: 'Enterprise',
      slug: 'ENTERPRISE',
      priceMonthly: 999,
      priceYearly: 9990,
      description: 'Custom infrastructure, unlimited scaling, and tailored SLA.',
      features: [
        'Unlimited Projects',
        'Unlimited Test Runs',
        'Unlimited AI Diagnostic Tokens',
        'Unlimited Browser Sandbox Minutes',
        'Unlimited Mobile Sandbox Minutes',
        '5 TB High-Speed Artifact Storage',
        'Unlimited Team Member Seats',
        'On-Premise Private Runner Grids',
        '99.99% Uptime SLA Guarantee'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
          <CreditCard className="h-3.5 w-3.5" />
          TRANSPARENT VALUE-BASED PRICING
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Scale your software quality with confidence.
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Zero card required for community tier. Upgrade as your testing volume and team grow. Powered by Paymob Unified Checkout.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
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
          <span className={`text-xs font-bold flex items-center gap-1.5 ${billingInterval === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
            Yearly Billing
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              2 MONTHS FREE
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = billingInterval === 'yearly' ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.slug}
              className={`glass-panel p-8 rounded-2xl border flex flex-col justify-between space-y-6 shadow-xl relative ${
                plan.isPopular
                  ? 'border-cyan-500 bg-cyan-950/10'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 right-6 text-[10px] font-bold px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 font-mono shadow">
                  MOST POPULAR
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold text-white">${price}</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {plan.priceMonthly === 0 ? 'forever' : billingInterval === 'yearly' ? '/ year' : '/ month'}
                  </span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/register"
                className={`w-full py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                {plan.priceMonthly === 0 ? 'Get Started Free' : 'Choose ' + plan.name}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Feature Matrix Table */}
      <div className="space-y-6 pt-10">
        <h2 className="text-2xl font-bold text-white text-center">Detailed Dimension Comparison</h2>
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs text-slate-300 font-sans">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 font-mono">
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
                <td className="px-6 py-3.5 font-sans font-bold text-white">Active Projects</td>
                <td className="px-4 py-3.5">2</td>
                <td className="px-4 py-3.5">5</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">15</td>
                <td className="px-4 py-3.5">30</td>
                <td className="px-4 py-3.5">100</td>
                <td className="px-4 py-3.5">Unlimited</td>
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
                <td className="px-6 py-3.5 font-sans font-bold text-white">Self-Healing Selectors</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5 text-emerald-400">Included</td>
                <td className="px-4 py-3.5 text-emerald-400">Included</td>
                <td className="px-4 py-3.5 text-emerald-400">Included</td>
                <td className="px-4 py-3.5 text-emerald-400">Included</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">MCP AI Agent Bridge</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">35 Tools</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">35 Tools</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">35 Tools</td>
                <td className="px-4 py-3.5 text-cyan-400 font-bold">Custom Tools</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3.5 font-sans font-bold text-white">Defensive DAST Security</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5 text-slate-500">—</td>
                <td className="px-4 py-3.5 text-emerald-400">Included</td>
                <td className="px-4 py-3.5 text-emerald-400">Included</td>
                <td className="px-4 py-3.5 text-emerald-400">Included</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
