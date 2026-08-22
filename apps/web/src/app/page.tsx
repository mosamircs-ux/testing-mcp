import Link from 'next/link';
import { Play, Sparkles, Terminal, Shield, CheckCircle2, Cpu, ArrowRight, Zap, RefreshCw, Layers, Database, Globe, Smartphone, Code2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden grid-bg">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-accent-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          Autonomous Quality Engineering 2.0
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 max-w-5xl mx-auto leading-[1.1]">
          The Autonomous AI Platform for{' '}
          <span className="glow-gradient-text">Software Verification</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Connect your Web, API, and Mobile repositories. NovaQA autonomously discovers application flows, generates executable Playwright tests, captures full telemetry, and triages failures with AI root cause analysis.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 font-bold text-sm hover:brightness-110 shadow-glow transition-all flex items-center gap-2"
          >
            <Play className="h-4 w-4 fill-slate-950" />
            Open Testing Console
          </Link>
          <Link
            href="/settings/mcp"
            className="px-8 py-3.5 rounded-xl glass-panel text-slate-200 font-semibold text-sm hover:bg-slate-800/60 border border-slate-700 hover:border-cyan-500/40 transition-all flex items-center gap-2"
          >
            <Terminal className="h-4 w-4 text-cyan-400" />
            Connect via MCP (Cursor / Claude)
          </Link>
        </div>

        {/* Live Test Run Visual Sandbox Card */}
        <div className="mt-16 max-w-5xl mx-auto rounded-2xl glass-panel-glow p-2 md:p-4 text-left">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 mb-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-2 text-slate-300 font-semibold">NovaQA Orchestrator Sandbox Execution</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              LIVE SSE STREAM
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-2">
            <div className="lg:col-span-2 bg-slate-950/80 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-900 space-y-2">
              <div className="text-cyan-400 font-semibold">[15:04:12] 🚀 Initializing Chromium Sandbox Engine...</div>
              <div className="text-slate-400">[15:04:13] 🌐 Navigating to target: https://storefront.acme.com/checkout</div>
              <div className="text-slate-400">[15:04:14] 🔍 Ingesting DOM tree (340 nodes, 14 inputs detected)</div>
              <div className="text-slate-400">[15:04:15] ⚡ Executing Step 2: Fill coupon code "SAVE20"</div>
              <div className="text-amber-400 font-medium">[15:04:16] ⚠️ Selector button[id="apply-coupon-btn"] timeout (2500ms)</div>
              <div className="text-cyan-300 font-semibold">[15:04:17] 🤖 AI Auto-Healer: Inferred replacement selector [data-testid="checkout-coupon-submit"] (Confidence: 98%)</div>
              <div className="text-emerald-400 font-bold">[15:04:18] ✅ Step 3 Auto-Healed & Passed (Discount applied -20%)</div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Failure Analyzer</span>
                <h4 className="text-sm font-bold text-slate-200 mt-1">Selector Drift Auto-Resolved</h4>
                <p className="text-xs text-slate-400 mt-2">
                  DOM mutation in checkout form was automatically reconciled without blocking CI/CD build.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400">Pass Rate: 100%</span>
                <span className="text-slate-500">Duration: 4.3s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">System Architecture</h2>
          <p className="text-3xl font-extrabold text-slate-100 mt-2">End-to-End Autonomous Testing Lifecycle</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="font-bold text-lg text-slate-100">Flow Discovery</h3>
            <p className="text-sm text-slate-400 mt-2">
              Analyzes OpenAPI specs, PRD requirements, and DOM crawl trees to map user journeys and edge cases.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="h-10 w-10 rounded-xl bg-accent-500/10 text-accent-400 flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="font-bold text-lg text-slate-100">Test Generation</h3>
            <p className="text-sm text-slate-400 mt-2">
              Synthesizes parameterized, deterministic Playwright & API contract tests with resilient assertions.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="font-bold text-lg text-slate-100">Sandbox Execution</h3>
            <p className="text-sm text-slate-400 mt-2">
              Executes in isolated sandboxes while capturing DOM snapshots, HAR network traces, console logs, and videos.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-lg mb-4">
              4
            </div>
            <h3 className="font-bold text-lg text-slate-100">AI Root Cause & Patch</h3>
            <p className="text-sm text-slate-400 mt-2">
              Classifies failures into Bug vs Flake vs Drift, generates git diffs, and heals broken selectors.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Targets Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold text-accent-400 uppercase tracking-widest">Multi-Platform Matrix</h2>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-2">Built for Every Tier of Modern Software</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: Globe, name: 'Web Applications', desc: 'Next.js, React, Vue, Svelte, Angular' },
            { icon: Code2, name: 'REST & GraphQL APIs', desc: 'OpenAPI 3.1, Apollo, Fastify, Spring' },
            { icon: Smartphone, name: 'Mobile Applications', desc: 'React Native, Flutter, Android, iOS' },
            { icon: Database, name: 'Backend & Microservices', desc: 'SaaS, Fintech, ERP, Healthcare' }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-xl border border-slate-800">
              <item.icon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-200 text-sm">{item.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Transparent Pricing</h2>
          <p className="text-3xl font-extrabold text-slate-100 mt-2">Simple, Predictable Plans</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-200">Developer</h3>
              <p className="text-xs text-slate-400 mt-1">For individual engineers and open source</p>
              <div className="mt-6 text-3xl font-extrabold text-slate-100">$0 <span className="text-sm font-normal text-slate-400">/mo</span></div>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> 100 Test Runs / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> Standard MCP Integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> Web & API Test Runners</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 block text-center py-2.5 rounded-xl border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-800">
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="glass-panel-glow p-8 rounded-2xl border border-cyan-500/40 relative flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="font-bold text-lg text-cyan-300">Team Pro</h3>
              <p className="text-xs text-slate-400 mt-1">For scaling development teams</p>
              <div className="mt-6 text-3xl font-extrabold text-slate-100">$79 <span className="text-sm font-normal text-slate-400">/mo</span></div>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> 2,500 Test Runs / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> Autonomous AI Auto-Healing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> Video & HAR Telemetry Storage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> Unlimited MCP Sessions</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 block text-center py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-glow">
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-200">Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1">For large organizations with strict SLA</p>
              <div className="mt-6 text-3xl font-extrabold text-slate-100">Custom</div>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> Dedicated Test Sandboxes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> Self-Hosted / On-Premise option</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> SSO, SAML, Audit Logging</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400" /> Custom LLM fine-tuning</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 block text-center py-2.5 rounded-xl border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-800">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
