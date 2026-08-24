'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  Server,
  Zap,
  Tag
} from 'lucide-react';

interface SuiteItem {
  id: string;
  name: string;
  description: string;
  testCasesCount: number;
  passRate: number;
  lastRun: string;
  duration: string;
  tags: string[];
  parallelWorkers: number;
  cronSchedule?: string;
  projectName: string;
}

export default function TestSuitesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const [suites, setSuites] = useState<SuiteItem[]>([
    {
      id: 'SUITE-001',
      name: 'Critical E-Commerce Smoke & Sanity Suite',
      description: 'End-to-end checkout, payment gateway verification, and user authentication.',
      testCasesCount: 14,
      passRate: 92.8,
      lastRun: '12 mins ago',
      duration: '18.4s',
      tags: ['smoke', 'checkout', 'p0'],
      parallelWorkers: 8,
      cronSchedule: '*/15 * * * *',
      projectName: 'NovaQA Storefront'
    },
    {
      id: 'SUITE-002',
      name: 'API Gateway & GraphQL Schema Regression',
      description: 'Mutation contracts, JWT authentication, and pagination boundary tests.',
      testCasesCount: 22,
      passRate: 100.0,
      lastRun: '25 mins ago',
      duration: '4.2s',
      tags: ['api', 'graphql', 'regression'],
      parallelWorkers: 12,
      cronSchedule: '0 * * * *',
      projectName: 'API Gateway'
    },
    {
      id: 'SUITE-003',
      name: 'Defensive Security & OWASP Top 10 Audit',
      description: 'CORS, CSRF, JWT alg none, SQL injection indicators, and header compliance.',
      testCasesCount: 18,
      passRate: 88.8,
      lastRun: '1 hour ago',
      duration: '12.1s',
      tags: ['security', 'owasp', 'cwe'],
      parallelWorkers: 4,
      cronSchedule: '0 0 * * *',
      projectName: 'Enterprise Platform'
    },
    {
      id: 'SUITE-004',
      name: 'Mobile Android & iOS Emulator Flow Suite',
      description: 'Gestures, hardware back button, deep links, and push notification routing.',
      testCasesCount: 11,
      passRate: 90.9,
      lastRun: '2 hours ago',
      duration: '32.6s',
      tags: ['mobile', 'android', 'ios'],
      parallelWorkers: 4,
      cronSchedule: '0 2 * * *',
      projectName: 'Mobile App'
    }
  ]);

  const filteredSuites = suites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Layers className="h-6 w-6 text-cyan-400" />
              Test Suites Orchestration
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {suites.length} Suites
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Group test cases by domain, allocate parallel worker sandboxes, and configure automated cron schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tests"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            All Test Cases
          </Link>
          <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold">
            <Plus className="h-4 w-4" />
            Create Suite
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 max-w-md">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter test suites by name, description, or #tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-sans"
        />
      </div>

      {/* Suites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSuites.map((suite) => (
          <div
            key={suite.id}
            className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-6 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">{suite.id}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {suite.parallelWorkers} Parallel Workers
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      suite.passRate >= 95
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {suite.passRate}% Pass Rate
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-white">{suite.name}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{suite.description}</p>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {suite.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-4">
                <span>{suite.testCasesCount} Tests</span>
                <span>•</span>
                <span>{suite.duration}</span>
                <span>•</span>
                <span>{suite.cronSchedule || 'Manual'}</span>
              </div>

              <button className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition font-sans text-xs">
                <Play className="h-3 w-3 fill-slate-950" />
                Run Suite
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
