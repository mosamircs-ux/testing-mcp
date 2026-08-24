'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Sparkles,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
  Terminal,
  GitBranch,
  Search,
  Wrench,
  RotateCcw,
  Smartphone,
  Globe,
  Database,
  Lock,
  Code2,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode2,
  ExternalLink,
  Eye,
  Sliders,
  Send,
  Workflow
} from 'lucide-react';

export default function SaaSMainLandingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [activeCoverageTab, setActiveCoverageTab] = useState<'WEB' | 'API' | 'MOBILE' | 'SECURITY' | 'E2E' | 'PERF'>('WEB');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Live Interactive Hero Sandbox State
  const [heroStep, setHeroStep] = useState(2);
  const heroSteps = [
    { title: '1. Discovering Routes & State Transitions', status: 'PASSED', time: '120ms', icon: Search },
    { title: '2. Executing Autonomous Checkout Flow', status: 'PASSED', time: '840ms', icon: Play },
    { title: '3. Probing Stripe & Paymob Webhook Response', status: 'RUNNING', time: '410ms', icon: Activity },
    { title: '4. Verifying Session Expiration & Role RBAC', status: 'PENDING', time: '—', icon: Lock },
    { title: '5. Analyzing Selector Drift & Self-Healing', status: 'PENDING', time: '—', icon: Wrench }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroStep((prev) => (prev >= heroSteps.length - 1 ? 0 : prev + 1));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const faqs = [
    {
      q: 'How does NovaQA differ from traditional test automation frameworks?',
      a: 'Traditional tools like Cypress or Selenium require human engineers to manually write and maintain test scripts line by line. NovaQA uses an autonomous AI testing agent that automatically discovers your application routes, APIs, and business workflows, generates realistic test plans, executes real browser and mobile sessions, and auto-heals brittle selectors.'
    },
    {
      q: 'Does NovaQA test real applications or just simulated code?',
      a: 'NovaQA executes genuine tests in real sandboxes: headless and headed Chromium, Firefox, WebKit, Android Emulators, iOS Simulators, and live REST/GraphQL APIs. We never mock out the actual DOM or fake device execution.'
    },
    {
      q: 'How does the Model Context Protocol (MCP) server work?',
      a: 'NovaQA exposes a production-grade 35-tool MCP server. When you pair program with AI coding assistants like Antigravity IDE, Claude, or Cursor, your agent can call NovaQA tools (e.g. project_discover, test_plan_generate, test_run, failure_analyze) to prove that its code changes actually work in production.'
    },
    {
      q: 'What is Self-Healing and will it hide genuine bugs?',
      a: 'NovaQA automatically repairs non-semantic selector drift (such as changed CSS classes or shifted IDs) and tunes wait strategies. However, the self-healing engine strictly differentiates between test flakiness and REAL_BUG regressions, ensuring legitimate application defects are highlighted with evidence rather than concealed.'
    },
    {
      q: 'How does CI/CD integration work?',
      a: 'You can trigger NovaQA on every pull request using GitHub Actions, GitLab CI, Jenkins, or our native CLI (`testing-platform test --suite regression`). You can define quality gate policies to automatically block merges if critical test failures or security findings are detected.'
    }
  ];

  return (
    <div className="space-y-24 md:space-y-32 pb-24 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* HERO SECTION                                                              */}
      {/* ========================================================================= */}
      <section className="relative pt-12 md:pt-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono font-semibold text-cyan-400 shadow-xl backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Autonomous Software Testing & Quality Agent</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Your AI Coding Agent Builds It.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-accent-400 bg-clip-text text-transparent block mt-1">
              Our AI Testing Agent Proves It.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed font-normal">
            Autonomous testing for web apps, APIs, dashboards, mobile applications, and full-stack systems. Real browsers, live sandboxes, self-healing selectors, and root-cause failure analysis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-extrabold bg-gradient-to-r from-cyan-500 via-teal-400 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center justify-center gap-2 group"
            >
              Start Testing Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-4 rounded-xl text-sm font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 fill-slate-300 text-slate-300" />
              Watch Live Demo
            </Link>
          </div>

          {/* Value Proof Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Real Playwright & Mobile Sandboxes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" /> Native MCP Server Bridge
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-purple-400" /> Zero Hallucination Quality
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* HERO VISUAL: ANIMATED TESTING DASHBOARD                               */}
        {/* ===================================================================== */}
        <div className="mt-14 max-w-5xl mx-auto glass-panel rounded-2xl border border-slate-700/60 p-4 md:p-6 shadow-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 relative overflow-hidden">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-mono text-slate-400 pl-2">novaqa-worker-grid-01 // test-run-live-8924</span>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                AUTONOMOUS EXECUTION
              </span>
              <span className="text-slate-500">Chromium 124.0.2</span>
            </div>
          </div>

          {/* Main Simulated Execution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
            {/* Left: Test Steps Execution Pipeline */}
            <div className="md:col-span-5 space-y-2.5 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase">
                <span>Autonomous Test Steps</span>
                <span>Latency</span>
              </div>

              {heroSteps.map((step, idx) => {
                const Icon = step.icon;
                const isCurrent = heroStep === idx;
                const isPassed = heroStep > idx;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/30 border-cyan-500/80 shadow-glow'
                        : isPassed
                        ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                        : 'border-slate-900 text-slate-600 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Activity className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <Icon className="h-4 w-4 text-slate-500 shrink-0" />
                      )}
                      <span className={`truncate ${isCurrent ? 'font-bold text-white' : ''}`}>
                        {step.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 shrink-0 pl-2">
                      {isPassed ? step.time : isCurrent ? 'RUNNING' : 'QUEUED'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right: Simulated Live Browser & Telemetry Canvas */}
            <div className="md:col-span-7 bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  https://app.saas-platform.com/checkout
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 text-[10px] font-bold">
                  HTTP 200 OK
                </span>
              </div>

              {/* Live UI State Mockup */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Shopping Cart & Order Summary</span>
                  <span className="text-cyan-400 font-mono font-bold">$79.00 USD</span>
                </div>
                <div className="h-2 w-3/4 bg-slate-800 rounded" />
                <div className="h-2 w-1/2 bg-slate-800 rounded" />
                <div className="flex gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                    ✓ Selector matched: #paymob-checkout-btn
                  </span>
                  <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono">
                    ✓ HMAC SHA-512 Verified
                  </span>
                </div>
              </div>

              {/* AI Failure Analysis Telemetry Live Log */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 text-cyan-400 font-bold">
                    <Sparkles className="h-3 w-3" /> AI Verification Log
                  </span>
                  <span>Confidence: 99.4%</span>
                </div>
                <p className="text-slate-300">
                  Autonomous agent executed checkout journey with 0 runtime exceptions. All API mutations verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 1: THE PROBLEM                                                    */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
            The AI Coding Paradox
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            AI-generated software can look complete while important workflows remain broken.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Coding assistants write hundreds of lines in seconds. But syntax correctness is not functional correctness. Without autonomous execution testing, hidden regressions slip directly into production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3 bg-gradient-to-b from-slate-900/60 to-slate-950">
            <div className="p-2.5 w-fit rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/60">
              <XCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Hallucinated State Transitions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Components render cleanly on initial load, but subtle race conditions, auth state drops, and unhandled pagination crash the browser during user interactions.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3 bg-gradient-to-b from-slate-900/60 to-slate-950">
            <div className="p-2.5 w-fit rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Silent API & Webhook Breakages</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Backend payload changes break billing webhooks, idempotency keys, and database constraints without failing superficial unit tests.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3 bg-gradient-to-b from-slate-900/60 to-slate-950">
            <div className="p-2.5 w-fit rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/60">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Brittle Test Maintenance Tax</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manually written end-to-end tests break constantly when CSS selectors shift, turning CI pipelines red and destroying developer momentum.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE SOLUTION (6 PILLARS)                                       */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            The NovaQA Autonomous Quality Lifecycle
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Six pillars of autonomous verification.
          </h2>
          <p className="text-slate-400 text-sm">
            From initial codebase discovery to automated patch proposals, NovaQA proves application behavior end-to-end.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { step: '01', name: 'Understand', desc: 'Discovers routes, forms, APIs, and permission matrices.', icon: Search },
            { step: '02', name: 'Plan', desc: 'Synthesizes happy, negative, and edge-case test matrices.', icon: FileCode2 },
            { step: '03', name: 'Test', desc: 'Executes real multi-engine browser and mobile sessions.', icon: Play },
            { step: '04', name: 'Analyze', desc: 'Deep AI root-cause diagnosis across DOM, network, and logs.', icon: Sparkles },
            { step: '05', name: 'Fix', desc: 'Self-heals selectors and proposes verified code diff patches.', icon: Wrench },
            { step: '06', name: 'Verify', desc: 'Reruns regression suites to confirm zero collateral impact.', icon: CheckCircle2 }
          ].map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3 bg-gradient-to-b from-slate-900/80 to-slate-950"
              >
                <span className="text-[10px] font-mono font-bold text-cyan-400">{pillar.step}</span>
                <Icon className="h-6 w-6 text-white" />
                <h3 className="text-sm font-bold text-white">{pillar.name}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: HOW IT WORKS                                                   */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Zero-configuration autonomous testing workflow.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              STEP 1
            </span>
            <h3 className="text-base font-bold text-white">Connect Project & Discover</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Link your repository via CLI, GitHub webhook, or live URL. NovaQA crawls application state, discovers API contracts, and constructs an internal Product Specification.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <span className="text-xs font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
              STEP 2
            </span>
            <h3 className="text-base font-bold text-white">Generate & Run Real Tests</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              NovaQA generates executable end-to-end scenarios and executes them across real Playwright browsers, API workers, and mobile emulators in isolated sandboxes.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
              STEP 3
            </span>
            <h3 className="text-base font-bold text-white">Analyze Failures & Self-Heal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Failures are automatically classified. The agent auto-heals selector drift or provides exact diff patches with regression verification before merging.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: TESTING COVERAGE (8 DIMENSIONS)                                */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
            Multi-Platform Coverage
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Complete full-stack verification across every layer.
          </h2>
        </div>

        {/* Dimension Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'WEB', label: 'Web Applications', icon: Globe },
            { id: 'API', label: 'REST & GraphQL APIs', icon: Database },
            { id: 'MOBILE', label: 'Mobile (Android & iOS)', icon: Smartphone },
            { id: 'SECURITY', label: 'Defensive DAST Security', icon: ShieldCheck },
            { id: 'E2E', label: 'Cross-Page Workflows', icon: Workflow },
            { id: 'PERF', label: 'Core Web Vitals', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeCoverageTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCoverageTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-glow'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Coverage Content Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 to-slate-950 max-w-4xl mx-auto">
          {activeCoverageTab === 'WEB' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Chromium, Firefox & WebKit Real Browser Sandboxes</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Executes complete UI interactions, form filling, drag-and-drop, modals, toasts, canvas elements, and asynchronous React state updates in clean headless or headed browsers.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-cyan-400 pt-2">
                <span>✓ DOM Mutation Telemetry</span>
                <span>✓ Network Interception & HAR</span>
                <span>✓ Video & Trace Artifacts</span>
                <span>✓ Viewport & Responsive Resizing</span>
              </div>
            </div>
          )}

          {activeCoverageTab === 'API' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Autonomous API Contract & Mutation Probing</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Discovers OpenAPI specifications and live HTTP endpoints. Tests authentication requirements, authorization boundaries, input schema validation, and response leaking.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-emerald-400 pt-2">
                <span>✓ Idempotency & Replay Testing</span>
                <span>✓ Rate Limiting Headers</span>
                <span>✓ JWT Expiration Verification</span>
                <span>✓ Deep JSON Schema Assertion</span>
              </div>
            </div>
          )}

          {activeCoverageTab === 'MOBILE' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Android Emulator & iOS Simulator Cloud Grid</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Runs native Android APKs and iOS apps. Tests gesture actions (tap, long press, swipe, scroll), permission popups, push notifications, offline mode recovery, and deep links.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-purple-400 pt-2">
                <span>✓ Native Appium / Driver Workers</span>
                <span>✓ Network Throttling Emulation</span>
                <span>✓ Device Rotation & Permissions</span>
                <span>✓ Crash Stack Trace Extraction</span>
              </div>
            </div>
          )}

          {activeCoverageTab === 'SECURITY' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Defensive Application Security Testing (DAST)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Continuously probes applications for OWASP Top 10 vulnerabilities, IDOR flaws, CORS misconfigurations, security headers, SQLi indicators, XSS reflections, and SSRF vectors.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-rose-400 pt-2">
                <span>✓ RBAC Boundary Escalation</span>
                <span>✓ Secrets Leakage Detection</span>
                <span>✓ Cookie Security & Flags</span>
                <span>✓ Remediation Patch Proposals</span>
              </div>
            </div>
          )}

          {activeCoverageTab === 'E2E' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Multi-Role Cross-Page Business Journeys</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Validates transactional flows: Admin creates invite &rarr; User receives email &rarr; Completes onboarding &rarr; Processes Paymob checkout &rarr; Verifies webhook activation.
              </p>
            </div>
          )}

          {activeCoverageTab === 'PERF' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Core Web Vitals & Real-Time Performance</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Measures LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift), and API response latency distributions under load.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: MODEL CONTEXT PROTOCOL (MCP)                                   */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950/30 relative overflow-hidden space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
                <Terminal className="h-3.5 w-3.5" />
                OFFICIAL MCP SERVER INTERFACE
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white">
                Connect your AI coding agent directly to the testing engine.
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Tell your AI coding assistant (Antigravity IDE, Claude, Cursor): <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-mono">"Test this project"</code>. The agent autonomously discovers the app, executes suites, analyzes failures, and delivers verified fixes through 35 native MCP tools.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 shrink-0 w-full md:w-auto">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Supported MCP Clients</div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Antigravity IDE 2.0
              </div>
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Claude Desktop
              </div>
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                Cursor & Generic MCP
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 & 8: FAILURE INTELLIGENCE & SELF-HEALING                        */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/60">
          <div className="p-2.5 w-fit rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Failure Intelligence & Root Cause</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            When a test fails, NovaQA evaluates DOM changes, screenshots, network requests, console logs, and stack traces. It classifies failures across 10 distinct failure categories so your team fixes real bugs instead of chasing ghosts.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 pt-2">
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">REAL_BUG</span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">SELECTOR_DRIFT</span>
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">TIMING_ISSUE</span>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">AUTH_ISSUE</span>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/60">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Autonomous Self-Healing Selectors</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Eliminates test maintenance fatigue. When a UI element shifts or class names change during a redesign, NovaQA automatically updates locators and retry tuning without hiding legitimate functional defects.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs border border-slate-800 text-slate-300 space-y-1">
            <span className="text-slate-500 text-[10px]">Auto-Heal Engine:</span>
            <div className="text-emerald-400 text-[11px]">
              + Updated locator: [data-testid="checkout-submit"]
            </div>
            <div className="text-slate-400 text-[10px]">
              (Confidence: 98.6% • Collateral regression risk: LOW)
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9 & 10: CI/CD & CONTINUOUS SECURITY GATES                         */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4">
          <div className="p-2.5 w-fit rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <GitBranch className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">CI/CD Quality Gates</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Embed continuous quality gates in GitHub Actions, GitLab CI, Jenkins, or webhooks. Automatically fail builds if critical defects, security findings, or coverage drops are detected.
          </p>
          <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs border border-slate-800 text-cyan-400">
            $ testing-platform test --suite regression --security
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4">
          <div className="p-2.5 w-fit rounded-xl bg-teal-950 text-teal-400 border border-teal-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Continuous Defensive Security</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Scan your running staging environments on every deployment for unauthorized data access, IDOR vulnerabilities, SSRF weaknesses, and exposed secrets before hackers find them.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Check className="h-4 w-4" /> OWASP Top 10 • RBAC Matrix Verification
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 11: DYNAMIC PRICING                                               */}
      {/* ========================================================================= */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Transparent Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Predictable plans that scale with your engineering team.
          </h2>
          <p className="text-slate-400 text-sm">
            Powered by Paymob Unified Checkout. Instant prorated upgrade. No hidden fees.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-bold ${billingInterval === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly
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
              Yearly
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                2 MONTHS FREE
              </span>
            </span>
          </div>
        </div>

        {/* 6 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Free Community Tier',
              slug: 'FREE',
              priceMonthly: 0,
              priceYearly: 0,
              desc: 'For individual developers and open-source projects.',
              features: ['2 Projects', '100 Test Runs/mo', '50k AI Tokens', '120 Browser Mins', '1 GB Storage', '2 Team Members']
            },
            {
              name: 'Starter Tier',
              slug: 'STARTER',
              priceMonthly: 29,
              priceYearly: 290,
              desc: 'For growing startup squads launching autonomous testing.',
              features: ['5 Projects', '1,000 Test Runs/mo', '500k AI Tokens', '1,000 Browser Mins', '60 Mobile Mins', '10 GB Storage', '5 Team Members']
            },
            {
              name: 'Professional Tier',
              slug: 'PRO',
              priceMonthly: 79,
              priceYearly: 790,
              desc: 'For agile engineering teams with continuous CI/CD releases.',
              features: ['15 Projects', '5,000 Test Runs/mo', '2M AI Tokens', '5,000 Browser Mins', '300 Mobile Mins', '50 GB Storage', '15 Team Members', 'Self-Healing Selectors'],
              isPopular: true
            },
            {
              name: 'Team Tier',
              slug: 'TEAM',
              priceMonthly: 199,
              priceYearly: 1990,
              desc: 'For multi-squad QA departments scaling cross-platform suites.',
              features: ['30 Projects', '15,000 Test Runs/mo', '5M AI Tokens', '15,000 Browser Mins', '1,000 Mobile Mins', '150 GB Storage', '30 Team Members', 'Defensive AppSec DAST']
            },
            {
              name: 'Business Tier',
              slug: 'BUSINESS',
              priceMonthly: 499,
              priceYearly: 4990,
              desc: 'For enterprise organizations with compliance and high throughput.',
              features: ['100 Projects', '50,000 Test Runs/mo', '20M AI Tokens', '50,000 Browser Mins', '5,000 Mobile Mins', '500 GB Storage', '100 Team Members', 'Full MCP Server Bridge']
            },
            {
              name: 'Enterprise Tier',
              slug: 'ENTERPRISE',
              priceMonthly: 999,
              priceYearly: 9990,
              desc: 'Custom infrastructure, unlimited scaling, and tailored SLA.',
              features: ['Unlimited Projects', 'Unlimited Runs', 'Unlimited AI Tokens', 'Unlimited Browser Mins', 'Unlimited Mobile Mins', '5 TB Storage', 'Unlimited Team Members', 'Private Runner Grids']
            }
          ].map((plan) => {
            const price = billingInterval === 'yearly' ? plan.priceYearly : plan.priceMonthly;

            return (
              <div
                key={plan.slug}
                className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between space-y-6 shadow-xl relative ${
                  plan.isPopular ? 'border-cyan-500 bg-cyan-950/10' : 'border-slate-800'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 right-6 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 font-mono shadow">
                    MOST POPULAR
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">${price}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {plan.priceMonthly === 0 ? 'forever' : billingInterval === 'yearly' ? '/ year' : '/ month'}
                    </span>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300 font-sans">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/checkout?plan=${plan.slug}&interval=${billingInterval}`}
                  className={`w-full py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {plan.priceMonthly === 0 ? 'Start Free Community' : `Select ${plan.name.replace(' Tier', '')} →`}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 12: FREQUENTLY ASKED QUESTIONS                                    */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            FAQ
          </span>
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;

            return (
              <div
                key={idx}
                className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-white hover:text-cyan-400 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-cyan-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 13: FINAL CALL TO ACTION                                          */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="glass-panel p-10 md:p-16 rounded-3xl border border-cyan-500/50 bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ship with proof.
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Stop deploying AI-generated software with blind faith. Give your coding assistants an autonomous quality agent that proves every workflow before your users see it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl text-sm font-extrabold bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Start Testing Free Now
            </Link>
            <Link
              href="/docs"
              className="px-6 py-4 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
