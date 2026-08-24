'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  SlidersHorizontal,
  Play,
  Trash2,
  Tag,
  ArrowUpDown,
  MoveRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Plus,
  X,
  User,
  Radio,
  Server
} from 'lucide-react';

interface TestCaseItem {
  id: string;
  name: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'Functional' | 'API' | 'E2E' | 'Security' | 'Mobile';
  status: 'PASSED' | 'FAILED' | 'FLAKY' | 'BLOCKED' | 'QUEUED';
  lastRun: string;
  duration: string;
  environment: string;
  owner: string;
  tags: string[];
  suiteName: string;
  stepsCount: number;
  flakinessScore: number;
}

export default function TestListPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [envFilter, setEnvFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestCase, setSelectedTestCase] = useState<TestCaseItem | null>(null);

  // Test Case inventory
  const [testCases, setTestCases] = useState<TestCaseItem[]>([
    {
      id: 'TC-AUTH-001',
      name: 'Verify OAuth2 SSO Authentication with Google',
      priority: 'CRITICAL',
      category: 'Functional',
      status: 'PASSED',
      lastRun: '10 mins ago',
      duration: '1.42s',
      environment: 'Production',
      owner: 'Alex Rivera',
      tags: ['auth', 'sso', 'smoke'],
      suiteName: 'Core Auth Suite',
      stepsCount: 5,
      flakinessScore: 0.0
    },
    {
      id: 'TC-AUTH-002',
      name: 'Enforce RBAC Permission Guard on Billing Portal',
      priority: 'CRITICAL',
      category: 'Security',
      status: 'PASSED',
      lastRun: '15 mins ago',
      duration: '0.88s',
      environment: 'Staging',
      owner: 'Sara Chen',
      tags: ['rbac', 'security', 'billing'],
      suiteName: 'Enterprise Security Suite',
      stepsCount: 4,
      flakinessScore: 0.0
    },
    {
      id: 'TC-CART-004',
      name: 'Verify Shopping Cart Checkout with Express Shipping',
      priority: 'HIGH',
      category: 'E2E',
      status: 'FAILED',
      lastRun: '4 mins ago',
      duration: '4.82s',
      environment: 'Staging',
      owner: 'David Kim',
      tags: ['checkout', 'cart', 'e2e'],
      suiteName: 'E-Commerce Regression',
      stepsCount: 7,
      flakinessScore: 0.12
    },
    {
      id: 'TC-API-009',
      name: 'GraphQL Mutation Variable Injection & Schema Validation',
      priority: 'HIGH',
      category: 'API',
      status: 'PASSED',
      lastRun: '22 mins ago',
      duration: '0.34s',
      environment: 'Production',
      owner: 'Elena Rostova',
      tags: ['graphql', 'api', 'schema'],
      suiteName: 'API Quality Suite',
      stepsCount: 3,
      flakinessScore: 0.0
    },
    {
      id: 'TC-MOB-003',
      name: 'Mobile Push Notification Routing & Deep Link Retention',
      priority: 'MEDIUM',
      category: 'Mobile',
      status: 'FLAKY',
      lastRun: '1 hour ago',
      duration: '3.15s',
      environment: 'Development',
      owner: 'Marcus Vance',
      tags: ['mobile', 'android', 'deeplink'],
      suiteName: 'Mobile Android Suite',
      stepsCount: 6,
      flakinessScore: 0.45
    },
    {
      id: 'TC-PRD-012',
      name: 'Project Discovery Spec Generation & Routes Topology Mapping',
      priority: 'HIGH',
      category: 'Functional',
      status: 'PASSED',
      lastRun: '45 mins ago',
      duration: '1.95s',
      environment: 'Production',
      owner: 'Sara Chen',
      tags: ['discovery', 'ai', 'prd'],
      suiteName: 'Autonomous AI Suite',
      stepsCount: 5,
      flakinessScore: 0.0
    },
    {
      id: 'TC-SRCH-007',
      name: 'ElasticSearch Query Param Boundary & XSS Sanitization',
      priority: 'CRITICAL',
      category: 'Security',
      status: 'BLOCKED',
      lastRun: '2 hours ago',
      duration: '0.00s',
      environment: 'Staging',
      owner: 'Alex Rivera',
      tags: ['security', 'xss', 'search'],
      suiteName: 'Defensive Security Suite',
      stepsCount: 4,
      flakinessScore: 0.0
    },
    {
      id: 'TC-PERF-015',
      name: 'Simultaneous 50-Worker Parallel Sandbox Queue Execution',
      priority: 'MEDIUM',
      category: 'API',
      status: 'QUEUED',
      lastRun: 'Pending',
      duration: '--',
      environment: 'Staging',
      owner: 'DevOps Bot',
      tags: ['performance', 'concurrency', 'workers'],
      suiteName: 'Stress & Load Suite',
      stepsCount: 8,
      flakinessScore: 0.0
    }
  ]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTests.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredTests = testCases.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesEnv = envFilter === 'ALL' || t.environment === envFilter;
    const matchesOwner = ownerFilter === 'ALL' || t.owner === ownerFilter;
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesPriority && matchesCategory && matchesEnv && matchesOwner && matchesSearch;
  });

  // Bulk Actions
  const handleBulkRun = () => {
    alert(`Triggered parallel test execution for ${selectedIds.length} selected test cases.`);
  };

  const handleBulkDelete = () => {
    setTestCases(testCases.filter((t) => !selectedIds.includes(t.id)));
    setSelectedIds([]);
  };

  const handleBulkPrioritize = (priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    setTestCases(
      testCases.map((t) => (selectedIds.includes(t.id) ? { ...t, priority } : t))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header & New Test Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Layers className="h-6 w-6 text-cyan-400" />
              Test Catalog & Test Cases
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {testCases.length} Defined
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise QA test inventory, multi-engine execution parameters, and bulk lifecycle actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/suites"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            Manage Suites
          </Link>
          <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5 font-bold">
            <Plus className="h-4 w-4" />
            Create Test Case
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, or #tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-sans"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 text-xs text-slate-300 px-3 py-2 rounded-lg border border-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="FLAKY">Flaky</option>
              <option value="BLOCKED">Blocked</option>
              <option value="QUEUED">Queued</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 text-xs text-slate-300 px-3 py-2 rounded-lg border border-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Priority: All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 text-xs text-slate-300 px-3 py-2 rounded-lg border border-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Category: All</option>
              <option value="Functional">Functional</option>
              <option value="API">API</option>
              <option value="E2E">E2E</option>
              <option value="Security">Security</option>
              <option value="Mobile">Mobile</option>
            </select>

            {/* Environment */}
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="bg-slate-950 text-xs text-slate-300 px-3 py-2 rounded-lg border border-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Env: All</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>

            {/* Owner */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="bg-slate-950 text-xs text-slate-300 px-3 py-2 rounded-lg border border-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Owner: All</option>
              <option value="Alex Rivera">Alex Rivera</option>
              <option value="Sara Chen">Sara Chen</option>
              <option value="David Kim">David Kim</option>
              <option value="Elena Rostova">Elena Rostova</option>
              <option value="Marcus Vance">Marcus Vance</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar (Visible when rows selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-950/50 border border-cyan-800/80 animate-in fade-in slide-in-from-top-2">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-cyan-400" />
              {selectedIds.length} Test Case{selectedIds.length > 1 ? 's' : ''} Selected
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBulkRun}
                className="px-3 py-1 text-xs font-bold rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center gap-1.5 transition"
              >
                <Play className="h-3 w-3 fill-slate-950" />
                Run Selected
              </button>

              <button
                onClick={() => handleBulkPrioritize('CRITICAL')}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
              >
                Set Critical
              </button>

              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 flex items-center gap-1 transition"
              >
                <Trash2 className="h-3 w-3 text-rose-400" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table + Slide-over Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Cases Table */}
        <div className={`space-y-4 ${selectedTestCase ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 select-none">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-slate-400 hover:text-cyan-400">
                        {selectedIds.length === filteredTests.length && filteredTests.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Last Run</th>
                    <th className="px-3 py-3">Duration</th>
                    <th className="px-3 py-3">Env</th>
                    <th className="px-4 py-3">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredTests.map((test) => {
                    const isSelected = selectedIds.includes(test.id);
                    const isDrawerOpen = selectedTestCase?.id === test.id;

                    return (
                      <tr
                        key={test.id}
                        className={`transition-colors cursor-pointer ${
                          isDrawerOpen
                            ? 'bg-slate-800/80 border-l-2 border-cyan-500'
                            : isSelected
                            ? 'bg-cyan-950/20'
                            : 'hover:bg-slate-800/40'
                        }`}
                        onClick={() => setSelectedTestCase(test)}
                      >
                        {/* Checkbox */}
                        <td
                          className="px-3 py-3.5 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(test.id);
                          }}
                        >
                          <button className="text-slate-400 hover:text-cyan-400">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-cyan-400" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        {/* ID */}
                        <td className="px-3 py-3.5 font-bold text-cyan-400 whitespace-nowrap">
                          {test.id}
                        </td>

                        {/* Name & Tags */}
                        <td className="px-4 py-3.5 font-sans font-medium text-slate-200">
                          <div className="line-clamp-1">{test.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {test.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              test.priority === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : test.priority === 'HIGH'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {test.priority}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-3 py-3.5 font-sans text-xs text-slate-300 whitespace-nowrap">
                          {test.category}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              test.status === 'PASSED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : test.status === 'FAILED'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : test.status === 'FLAKY'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : test.status === 'BLOCKED'
                                ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            }`}
                          >
                            {test.status}
                          </span>
                        </td>

                        {/* Last Run */}
                        <td className="px-3 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">
                          {test.lastRun}
                        </td>

                        {/* Duration */}
                        <td className="px-3 py-3.5 text-[11px] text-slate-300 whitespace-nowrap">
                          {test.duration}
                        </td>

                        {/* Environment */}
                        <td className="px-3 py-3.5 font-sans text-[11px] text-slate-400 whitespace-nowrap">
                          {test.environment}
                        </td>

                        {/* Owner */}
                        <td className="px-4 py-3.5 font-sans text-xs text-slate-300 whitespace-nowrap">
                          {test.owner}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Test Case Detail Drawer */}
        {selectedTestCase && (
          <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <button
              onClick={() => setSelectedTestCase(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">{selectedTestCase.id}</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    selectedTestCase.priority === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {selectedTestCase.priority}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedTestCase.category}
                </span>
              </div>

              <h2 className="text-base font-bold text-white leading-snug">{selectedTestCase.name}</h2>

              {/* Meta Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Suite</div>
                  <div className="text-slate-300 font-sans mt-0.5 truncate">{selectedTestCase.suiteName}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Owner</div>
                  <div className="text-slate-300 font-sans mt-0.5 truncate">{selectedTestCase.owner}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Flakiness Score</div>
                  <div className="text-cyan-400 font-bold mt-0.5">
                    {(selectedTestCase.flakinessScore * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Steps</div>
                  <div className="text-slate-300 mt-0.5">{selectedTestCase.stepsCount} Actions</div>
                </div>
              </div>

              {/* Step Sequence Preview */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Step Sequence Preview
                </label>
                <div className="mt-2 space-y-1.5 font-mono text-xs text-slate-300">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>1. NAVIGATE /login</span>
                    <span className="text-[10px] text-emerald-400 font-bold">200 OK</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>2. TYPE input#email</span>
                    <span className="text-[10px] text-slate-500">qa@test.com</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>3. CLICK button#submit</span>
                    <span className="text-[10px] text-cyan-400">Target</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>4. ASSERT .dashboard</span>
                    <span className="text-[10px] text-emerald-400">Visible</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition">
                Edit Steps
              </button>
              <button className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 text-xs font-bold shadow-glow transition flex items-center justify-center gap-1.5">
                <Play className="h-3.5 w-3.5 fill-slate-950" />
                Run Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
