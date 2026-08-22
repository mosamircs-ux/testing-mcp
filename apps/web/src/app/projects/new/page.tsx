'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Globe,
  Server,
  Smartphone,
  Layers,
  Shield,
  FileCode,
  GitBranch,
  Sliders,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Key,
  Database,
  Cpu,
  Play
} from 'lucide-react';

const PROJECT_TYPES = [
  { id: 'WEB', label: 'Web Application', desc: 'Next.js, React, Vue, Svelte, Angular, SSR/SPA web apps', icon: Globe },
  { id: 'REST_API', label: 'REST API', desc: 'Express, FastAPI, NestJS, Spring Boot, Django REST endpoints', icon: Server },
  { id: 'GRAPHQL_API', label: 'GraphQL API', desc: 'Apollo Server, GraphQL schema queries, mutations & subscriptions', icon: Database },
  { id: 'MOBILE_REACT_NATIVE', label: 'Mobile App', desc: 'React Native, Expo, Flutter, iOS Swift, Android Kotlin', icon: Smartphone },
  { id: 'FULLSTACK', label: 'Full Stack Suite', desc: 'Monorepo, Next.js Fullstack, Web Frontend + Microservices', icon: Layers },
  { id: 'OTHER', label: 'Other Architecture', desc: 'Custom microservice, background queue worker, or CLI', icon: Cpu }
];

const ENVIRONMENTS = [
  { id: 'LOCAL', label: 'Local Development', desc: 'http://localhost:3000 or local Docker container' },
  { id: 'DEVELOPMENT', label: 'Dev Environment', desc: 'dev.domain.com shared cluster for early feature verification' },
  { id: 'STAGING', label: 'Staging / Pre-Prod', desc: 'staging.domain.com production-replica validation environment' },
  { id: 'PRODUCTION', label: 'Production Live', desc: 'Live customer-facing environment (safe synthetic monitoring)' }
];

const AUTH_TYPES = [
  { id: 'NONE', label: 'No Authentication', desc: 'Public application or unauthenticated endpoints' },
  { id: 'BEARER', label: 'Bearer Token (JWT)', desc: 'Header Authorization: Bearer <token>' },
  { id: 'LOGIN_FLOW', label: 'Synthetic Login Credentials', desc: 'Automated login step with username/password' },
  { id: 'COOKIE', label: 'Session Cookies', desc: 'HttpOnly cookie or custom session identifier' },
  { id: 'CUSTOM_HEADER', label: 'Custom Security Headers', desc: 'X-API-Key, X-Organization-Id, or custom secret header' }
];

export default function ProjectOnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;

  // Onboarding Form State
  const [formData, setFormData] = useState({
    name: 'E-Commerce Storefront & Payment Gateway',
    description: 'Autonomous end-to-end shopping cart, customer checkout, and payments testing project.',
    category: 'WEB',
    environment: 'STAGING',
    appUrl: 'http://localhost:3000',
    apiBaseUrl: 'http://localhost:4000',
    authConfig: {
      type: 'BEARER',
      username: 'testuser@company.com',
      password: 'Password123!',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      customHeaderName: 'X-Tenant-Key',
      customHeaderValue: 'sec_live_94829'
    },
    prdContent: '# Storefront Product Requirements\n\n## Overview\nStorefront allows users to browse products, filter by category, add items to cart, apply coupon discounts, and submit payment via Stripe checkout.\n\n## Critical Flows\n1. Search & Filter\n2. Cart Management\n3. Promo Code Discount\n4. Order Confirmation',
    repoConfig: {
      repositoryUrl: 'https://github.com/company/storefront-app.git',
      branch: 'main',
      localPath: 'c:/projects/storefront'
    },
    testingPreferences: {
      engineType: 'PLAYWRIGHT',
      viewportWidth: 1280,
      viewportHeight: 720,
      headless: true,
      autoHeal: true,
      captureVideo: true,
      captureScreenshots: true,
      timeoutMs: 30000
    },
    triggerDiscovery: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // In web app, we call the API to create and launch discovery
      const res = await fetch('/api/v1/projects/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to onboard project');
      }

      const projectId = json.data?.projectId;
      if (projectId) {
        router.push(`/projects/${projectId}/discovery`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      // If direct fetch fails (e.g. mock during dev), push to mock project discovery view
      console.warn('Onboarding fetch error, redirecting to project discovery:', err.message);
      router.push('/projects/cmtx-project-1/discovery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Autonomous Project Creation
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Create & Onboard Testing Project
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Configure your target application, authentication credentials, and repository. NovaQA will automatically execute a deep discovery analysis upon completion.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full mb-8 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-cyan-500 to-accent-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Step Container */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl mb-8 min-h-[420px] flex flex-col justify-between">
        <div>
          {/* STEP 1: Project Name & Description */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 1 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">Project Identity & Scope</h2>
                <p className="text-xs text-slate-400">Give your testing project a descriptive workspace identifier.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Customer Portal & Checkout Flow"
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Description & Context
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe what this project does and key testing goals..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Project Type */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 2 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">Target Application Architecture</h2>
                <p className="text-xs text-slate-400">Select the architecture type to calibrate engine sandboxes and AI analyzers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PROJECT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.category === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: type.id })}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-glow'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg shrink-0 ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{type.label}</div>
                        <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{type.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Target Environment */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 3 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">Initial Target Environment</h2>
                <p className="text-xs text-slate-400">Select which environment your initial test suites will target.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ENVIRONMENTS.map((env) => {
                  const isSelected = formData.environment === env.id;
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, environment: env.id })}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-glow'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-bold flex items-center justify-between">
                        <span>{env.label}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{env.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Application URL */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 4 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">Application URL (Web / Frontend)</h2>
                <p className="text-xs text-slate-400">Base URL where the browser and UI crawl engine can navigate.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Application Base URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="url"
                    value={formData.appUrl}
                    onChange={(e) => setFormData({ ...formData, appUrl: e.target.value })}
                    placeholder="https://app.staging.example.com or http://localhost:3000"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  Leave empty if testing a standalone API or backend service.
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: API Base URL */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 5 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">API Base URL (REST / GraphQL)</h2>
                <p className="text-xs text-slate-400">Target host for API endpoint contract assertions and telemetry capture.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  API Base URL
                </label>
                <div className="relative">
                  <Server className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="url"
                    value={formData.apiBaseUrl}
                    onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                    placeholder="https://api.staging.example.com or http://localhost:4000"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Authentication Configuration */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 6 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">Authentication & Security Credentials</h2>
                <p className="text-xs text-slate-400">Configure how synthetic test workers and AI agents authenticate with your application.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {AUTH_TYPES.map((auth) => {
                  const isSelected = formData.authConfig.type === auth.id;
                  return (
                    <button
                      key={auth.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, authConfig: { ...formData.authConfig, type: auth.id as any } })}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-slate-200">{auth.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{auth.desc}</div>
                    </button>
                  );
                })}
              </div>

              {formData.authConfig.type === 'BEARER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bearer Token / JWT Secret
                  </label>
                  <input
                    type="password"
                    value={formData.authConfig.token}
                    onChange={(e) => setFormData({ ...formData, authConfig: { ...formData.authConfig, token: e.target.value } })}
                    placeholder="eyJhbGciOiJIUzI1Ni..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              )}

              {formData.authConfig.type === 'LOGIN_FLOW' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Username / Email</label>
                    <input
                      type="text"
                      value={formData.authConfig.username}
                      onChange={(e) => setFormData({ ...formData, authConfig: { ...formData.authConfig, username: e.target.value } })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
                    <input
                      type="password"
                      value={formData.authConfig.password}
                      onChange={(e) => setFormData({ ...formData, authConfig: { ...formData.authConfig, password: e.target.value } })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: PRD Upload / Specification */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 7 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">Optional Product Requirements Document (PRD)</h2>
                <p className="text-xs text-slate-400">Paste your PRD or design doc. The Discovery Engine will use it to ground synthesized workflows.</p>
              </div>

              <div>
                <textarea
                  rows={7}
                  value={formData.prdContent}
                  onChange={(e) => setFormData({ ...formData, prdContent: e.target.value })}
                  placeholder="Paste markdown PRD, user stories, OpenAPI schema, or specification here..."
                  className="w-full px-4 py-3 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 8: Repository Connection */}
          {currentStep === 8 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 8 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">Repository Connection (Optional)</h2>
                <p className="text-xs text-slate-400">Connect a GitHub/GitLab repository or local workspace for code-level AST parsing.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Repository URL (Git)
                  </label>
                  <div className="relative">
                    <GitBranch className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={formData.repoConfig.repositoryUrl}
                      onChange={(e) => setFormData({ ...formData, repoConfig: { ...formData.repoConfig, repositoryUrl: e.target.value } })}
                      placeholder="https://github.com/organization/repo.git"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Default Branch
                  </label>
                  <input
                    type="text"
                    value={formData.repoConfig.branch}
                    onChange={(e) => setFormData({ ...formData, repoConfig: { ...formData.repoConfig, branch: e.target.value } })}
                    className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Testing Preferences */}
          {currentStep === 9 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 9 OF 9</span>
                <h2 className="text-lg font-bold text-white mt-1">Autonomous Testing Preferences</h2>
                <p className="text-xs text-slate-400">Configure execution sandboxes, self-healing, and telemetry capture parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-200">Autonomous Self-Healing</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Automatically repair broken element selectors on DOM drift</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.testingPreferences.autoHeal}
                    onChange={(e) => setFormData({
                      ...formData,
                      testingPreferences: { ...formData.testingPreferences, autoHeal: e.target.checked }
                    })}
                    className="h-4 w-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-200">Capture Video & Screenshots</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Record WebM videos and DOM snapshots for failure triage</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.testingPreferences.captureVideo}
                    onChange={(e) => setFormData({
                      ...formData,
                      testingPreferences: { ...formData.testingPreferences, captureVideo: e.target.checked }
                    })}
                    className="h-4 w-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-center gap-3">
                <Sparkles className="h-5 w-5 shrink-0 text-cyan-400" />
                <div>
                  <strong className="block font-semibold">Immediate Discovery Phase Trigger</strong>
                  <span>Upon clicking &quot;Launch Autonomous Discovery&quot;, NovaQA will immediately analyze all routes, APIs, schemas, and user journeys in real-time.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-glow flex items-center gap-1.5 transition-all"
            >
              Next Step
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-accent-400 to-cyan-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-glow flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              {isSubmitting ? 'Initializing Discovery Engine...' : 'Launch Autonomous Discovery'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
