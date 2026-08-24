'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock,
  Code2,
  RefreshCw,
  Search,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Flame,
  Check,
  X,
  Play
} from 'lucide-react';

interface FailureItem {
  id: string;
  title: string;
  rootCause: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'REAL_BUG' | 'SELECTOR_DRIFT' | 'TIMING_ISSUE' | 'NETWORK_ISSUE' | 'DATA_ISSUE' | 'AUTH_ISSUE';
  affectedFeature: string;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  suggestedFix: string;
  suggestedPatch: string;
  verificationStatus: 'OPEN' | 'FIX_PROPOSED' | 'FIX_APPROVED' | 'VERIFIED_RESOLVED';
  projectName: string;
  testCaseName: string;
}

export default function FailuresDashboardPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFailure, setSelectedFailure] = useState<FailureItem | null>(null);

  const [failures, setFailures] = useState<FailureItem[]>([
    {
      id: 'FAIL-CHK-001',
      title: 'Checkout Form Submission Timeout & Missing Field Error',
      rootCause: 'Dynamic address autocomplete component blocked main thread for 5200ms without resolving callback.',
      severity: 'CRITICAL',
      category: 'REAL_BUG',
      affectedFeature: 'E-Commerce Checkout & Payments',
      firstSeen: '2 days ago',
      lastSeen: '4 mins ago',
      occurrences: 14,
      suggestedFix: 'Add fallback timeout to Google Places Autocomplete script and wrap in async lazy boundary.',
      suggestedPatch: `--- a/src/components/CheckoutForm.tsx\n+++ b/src/components/CheckoutForm.tsx\n@@ -42,3 +42,5 @@\n- const res = await fetchAddressSync(query);\n+ const res = await Promise.race([\n+   fetchAddressSync(query),\n+   new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))\n+ ]);`,
      verificationStatus: 'FIX_PROPOSED',
      projectName: 'NovaQA Storefront',
      testCaseName: 'Verify Shopping Cart Checkout with Express Shipping'
    },
    {
      id: 'FAIL-SEL-002',
      title: 'Selector Drift: Submit Button Attribute Renamed in DOM',
      rootCause: 'Frontend team migrated button ID from #btn-submit to data-testid="checkout-submit-btn".',
      severity: 'HIGH',
      category: 'SELECTOR_DRIFT',
      affectedFeature: 'Order Confirmation Flow',
      firstSeen: 'Yesterday',
      lastSeen: '18 mins ago',
      occurrences: 8,
      suggestedFix: 'Self-heal test step locator to [data-testid="checkout-submit-btn"].',
      suggestedPatch: `--- a/tests/checkout.spec.ts\n+++ b/tests/checkout.spec.ts\n@@ -18,2 +18,2 @@\n- await page.click('#btn-submit');\n+ await page.click('[data-testid="checkout-submit-btn"]');`,
      verificationStatus: 'FIX_APPROVED',
      projectName: 'NovaQA Storefront',
      testCaseName: 'Submit Order Confirmation'
    },
    {
      id: 'FAIL-TIME-003',
      title: 'Race Condition in JWT Refresh Token Exchange',
      rootCause: 'Concurrent API calls triggered double-exchange on single-use refresh token.',
      severity: 'HIGH',
      category: 'TIMING_ISSUE',
      affectedFeature: 'OAuth2 Authentication',
      firstSeen: '3 days ago',
      lastSeen: '1 hour ago',
      occurrences: 6,
      suggestedFix: 'Implement in-memory promise mutex lock on token refresh interceptor.',
      suggestedPatch: `--- a/src/lib/api-client.ts\n+++ b/src/lib/api-client.ts\n@@ -89,2 +89,5 @@\n+ if (isRefreshing) return refreshPromise;\n+ isRefreshing = true;\n+ refreshPromise = performTokenRefresh();`,
      verificationStatus: 'VERIFIED_RESOLVED',
      projectName: 'API Gateway',
      testCaseName: 'Verify Concurrent Token Refresh Handling'
    },
    {
      id: 'FAIL-NET-004',
      title: 'Flaky Network Response on Third-Party Webhook Receipt',
      rootCause: 'Stripe staging sandbox latency spike (> 8000ms) caused gateway timeout.',
      severity: 'MEDIUM',
      category: 'NETWORK_ISSUE',
      affectedFeature: 'Webhook Ingestion Pipeline',
      firstSeen: '5 days ago',
      lastSeen: '2 hours ago',
      occurrences: 3,
      suggestedFix: 'Configure exponential backoff retry policy (3 retries with 1s initial delay).',
      suggestedPatch: `--- a/src/services/webhook.ts\n+++ b/src/services/webhook.ts\n@@ -15,2 +15,3 @@\n- return fetchWithRetry(url, options, 1);\n+ return fetchWithRetry(url, options, { maxRetries: 3, backoff: 'exponential' });`,
      verificationStatus: 'OPEN',
      projectName: 'Billing Microservice',
      testCaseName: 'Ingest Stripe Charge Succeeded Webhook'
    }
  ]);

  const filteredFailures = failures.filter((f) => {
    const matchesTab = activeTab === 'ALL' || f.severity === activeTab || f.verificationStatus === activeTab;
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.affectedFeature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Bug className="h-6 w-6 text-rose-400" />
              AI Failure Diagnostics & Triage Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-mono">
              {failures.length} Tracked
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic root cause classification across 10 failure categories, self-healing diff proposals, and 4-stage verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition">
            <RefreshCw className="h-3.5 w-3.5" />
            Re-run Triaged Tests
          </button>
          <Link
            href="/findings"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold"
          >
            <Sparkles className="h-3.5 w-3.5 fill-slate-950" />
            Auto-Heal All Drifts
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-rose-950/80 bg-rose-950/10">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Critical Failures</span>
          <div className="text-2xl font-extrabold text-white mt-1">1</div>
          <span className="text-[11px] text-rose-400/80 mt-1">Affecting Production Checkout</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-950/80 bg-amber-950/10">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Self-Healable</span>
          <div className="text-2xl font-extrabold text-white mt-1">2</div>
          <span className="text-[11px] text-amber-400/80 mt-1">1-Click Patch Generated</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-950/80 bg-emerald-950/10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Resolved & Verified</span>
          <div className="text-2xl font-extrabold text-white mt-1">1</div>
          <span className="text-[11px] text-emerald-400/80 mt-1">4-Stage Pipeline Passed</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Avg MTTR</span>
          <div className="text-2xl font-extrabold text-white mt-1">4.2m</div>
          <span className="text-[11px] text-cyan-400/80 mt-1">Mean Time to Resolution</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2 w-full md:w-96 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by root cause, feature, or error..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-sans"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {['ALL', 'CRITICAL', 'HIGH', 'FIX_PROPOSED', 'VERIFIED_RESOLVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === tab
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Failures List Table */}
        <div className={`space-y-4 ${selectedFailure ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Failure & Feature</th>
                    <th className="px-3 py-3">Severity</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Occurrences</th>
                    <th className="px-3 py-3">First Seen</th>
                    <th className="px-3 py-3">Last Seen</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredFailures.map((item) => {
                    const isSelected = selectedFailure?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedFailure(item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800/80 border-l-2 border-rose-500'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-4 py-3.5 font-sans">
                          <div className="font-bold text-slate-100">{item.title}</div>
                          <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                            {item.affectedFeature}
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              item.severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {item.severity}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 text-slate-300 text-xs">
                          {item.category}
                        </td>

                        <td className="px-3 py-3.5 font-bold text-rose-400">
                          {item.occurrences}x
                        </td>

                        <td className="px-3 py-3.5 text-slate-400 text-[11px]">
                          {item.firstSeen}
                        </td>

                        <td className="px-3 py-3.5 text-slate-300 text-[11px]">
                          {item.lastSeen}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.verificationStatus === 'VERIFIED_RESOLVED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : item.verificationStatus === 'FIX_PROPOSED'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {item.verificationStatus.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Failure Detail Inspector Drawer */}
        {selectedFailure && (
          <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <button
              onClick={() => setSelectedFailure(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    selectedFailure.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {selectedFailure.severity}
                </span>
                <span className="text-xs font-mono text-cyan-400">{selectedFailure.category}</span>
                <span className="text-xs text-slate-500 font-mono">Occurrences: {selectedFailure.occurrences}x</span>
              </div>

              <h2 className="text-base font-bold text-white leading-snug">{selectedFailure.title}</h2>

              {/* Root Cause */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  AI Root Cause Analysis
                </label>
                <p className="mt-1 p-3 rounded bg-rose-950/20 border border-rose-950/40 text-xs text-slate-200 leading-relaxed font-mono">
                  {selectedFailure.rootCause}
                </p>
              </div>

              {/* Suggested Fix */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Suggested Remediation
                </label>
                <p className="mt-1 p-3 rounded bg-emerald-950/20 border border-emerald-950/40 text-xs text-slate-200 leading-relaxed">
                  {selectedFailure.suggestedFix}
                </p>
              </div>

              {/* Proposed Patch Diff */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Proposed Git Patch Diff
                </label>
                <pre className="mt-1 p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedFailure.suggestedPatch}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition">
                Rerun Failed Test
              </button>
              <button className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110 text-xs font-bold shadow-glow transition flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" />
                Apply & Verify Patch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
