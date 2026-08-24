'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Building2,
  FolderGit2,
  CreditCard,
  Layers,
  Receipt,
  FileCode2,
  BarChart3,
  Activity,
  HeartPulse,
  Cpu,
  Bot,
  ShieldCheck,
  History,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  HardDrive,
  RefreshCw,
  Plus,
  Search,
  Filter,
  MoreVertical,
  X,
  Check,
  ExternalLink,
  Ban,
  RotateCcw,
  Gift,
  Coins
} from 'lucide-react';

type AdminSection =
  | 'OVERVIEW'
  | 'USERS'
  | 'ORGS'
  | 'PROJECTS'
  | 'SUBSCRIPTIONS'
  | 'PLANS'
  | 'PAYMENTS'
  | 'USAGE'
  | 'TEST_RUNS'
  | 'HEALTH'
  | 'WORKERS'
  | 'MCP'
  | 'SECURITY'
  | 'AUDIT_LOGS'
  | 'FEATURE_FLAGS';

export default function PlatformOwnerAdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [suspendModalOrg, setSuspendModalOrg] = useState<{ id: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [changePlanOrg, setChangePlanOrg] = useState<{ id: string; name: string; currentPlan: string } | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState('PRO');
  const [grantCreditOrg, setGrantCreditOrg] = useState<{ id: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState(50);
  const [creditReason, setCreditReason] = useState('');
  const [refundModalPayment, setRefundModalPayment] = useState<{ id: string; ref: string; amount: number } | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // 1. System Metrics
  const [metrics, setMetrics] = useState({
    activeUsers: 1420,
    activeOrganizations: 184,
    suspendedOrganizations: 3,
    dailyTestExecutions: 8940,
    failedTests: 312,
    passRatePercent: 96.5,
    totalRevenue: 148200.0,
    mrr: 28450.0,
    churnRatePercent: 1.4,
    storageUsageGb: 482.6,
    workerUtilizationPercent: 47.8,
    aiTokensUsed: 14200000,
    activeWorkers: 4,
    totalProjects: 310,
    activeMcpConnections: 18,
    criticalSecurityFindings: 2
  });

  // 2. Organizations
  const [organizations, setOrganizations] = useState([
    {
      id: 'org_001',
      name: 'Acme Global Financial',
      slug: 'acme-financial',
      tier: 'ENTERPRISE',
      status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
      membersCount: 48,
      projectsCount: 14,
      mrr: 999.0,
      createdAt: '2 months ago'
    },
    {
      id: 'org_002',
      name: 'NovaScale Health Tech',
      slug: 'novascale-health',
      tier: 'TEAM',
      status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
      membersCount: 22,
      projectsCount: 8,
      mrr: 199.0,
      createdAt: '1 month ago'
    },
    {
      id: 'org_003',
      name: 'HyperDrive Mobility',
      slug: 'hyperdrive-mobility',
      tier: 'PRO',
      status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
      membersCount: 12,
      projectsCount: 5,
      mrr: 79.0,
      createdAt: '3 weeks ago'
    },
    {
      id: 'org_004',
      name: 'Suspended Crypto Bot Lab',
      slug: 'suspended-crypto',
      tier: 'FREE',
      status: 'SUSPENDED' as 'ACTIVE' | 'SUSPENDED',
      membersCount: 1,
      projectsCount: 2,
      mrr: 0.0,
      createdAt: '5 days ago'
    }
  ]);

  // 3. Users
  const [users, setUsers] = useState([
    {
      id: 'usr_001',
      name: 'Alex Vance',
      email: 'alex@acmefinance.com',
      role: 'ORG_ADMIN',
      orgName: 'Acme Global Financial',
      verified: true,
      lastLogin: '10 minutes ago'
    },
    {
      id: 'usr_002',
      name: 'Sarah Connor',
      email: 'sarah@novascale.io',
      role: 'QA_ENGINEER',
      orgName: 'NovaScale Health Tech',
      verified: true,
      lastLogin: '1 hour ago'
    },
    {
      id: 'usr_003',
      name: 'Marcus Brody',
      email: 'marcus@hyperdrive.dev',
      role: 'DEVELOPER',
      orgName: 'HyperDrive Mobility',
      verified: true,
      lastLogin: 'Yesterday'
    }
  ]);

  // 4. Feature Flags
  const [featureFlags, setFeatureFlags] = useState([
    {
      key: 'AI_SELF_HEALING',
      name: 'AI Test Self-Healing Engine',
      description: 'Automatically detects selector drift and repairs locators in non-semantic tests.',
      isEnabled: true,
      minTier: 'PRO',
      rollout: '100%'
    },
    {
      key: 'MOBILE_EMULATORS',
      name: 'Mobile Emulator & Simulator Runners',
      description: 'Enables cloud Android and iOS mobile app execution workers.',
      isEnabled: true,
      minTier: 'STARTER',
      rollout: '100%'
    },
    {
      key: 'DAST_SCANNER',
      name: 'Defensive Application Security Testing (DAST)',
      description: 'Automated OWASP, RBAC boundary, and injection vulnerability probing.',
      isEnabled: true,
      minTier: 'TEAM',
      rollout: '100%'
    },
    {
      key: 'PARALLEL_EXECUTION',
      name: 'High-Concurrency Parallel Test Runners',
      description: 'Executes multiple browser & API test shards simultaneously.',
      isEnabled: true,
      minTier: 'ALL',
      rollout: '100%'
    },
    {
      key: 'CONTINUOUS_SCHEDULER',
      name: 'Continuous Cron Scheduler & Quality Gates',
      description: '5-min, hourly, and webhook CI/CD pipeline triggers with policy thresholds.',
      isEnabled: true,
      minTier: 'ALL',
      rollout: '100%'
    }
  ]);

  // 5. Paymob Payments
  const [payments, setPayments] = useState([
    {
      id: 'pmt_9001',
      merchantReference: 'pmt_1787559001_acme',
      paymobTransactionId: '987654321',
      orgName: 'Acme Global Financial',
      amount: 999.0,
      currency: 'USD',
      status: 'SUCCEEDED',
      plan: 'Enterprise (Monthly)',
      date: 'Today at 09:30 AM'
    },
    {
      id: 'pmt_9002',
      merchantReference: 'pmt_1787559002_nova',
      paymobTransactionId: '987654322',
      orgName: 'NovaScale Health Tech',
      amount: 199.0,
      currency: 'USD',
      status: 'SUCCEEDED',
      plan: 'Team (Monthly)',
      date: 'Yesterday'
    },
    {
      id: 'pmt_9003',
      merchantReference: 'pmt_1787559003_hyper',
      paymobTransactionId: 'Pending',
      orgName: 'HyperDrive Mobility',
      amount: 79.0,
      currency: 'USD',
      status: 'PENDING',
      plan: 'Professional (Monthly)',
      date: '2 days ago'
    }
  ]);

  // 6. Worker Nodes
  const [workers, setWorkers] = useState([
    {
      id: 'worker-01',
      name: 'US-East Chromium Grid 1',
      status: 'BUSY',
      concurrency: 16,
      activeJobs: 7,
      utilization: 43.7,
      platforms: 'Chromium, Firefox, WebKit, REST API',
      heartbeat: '1s ago'
    },
    {
      id: 'worker-02',
      name: 'EU-Central Mobile Cloud 1',
      status: 'ONLINE',
      concurrency: 8,
      activeJobs: 2,
      utilization: 25.0,
      platforms: 'Android Emulator, iOS Simulator, Appium',
      heartbeat: '2s ago'
    },
    {
      id: 'worker-03',
      name: 'AP-Southeast DAST Scanner',
      status: 'BUSY',
      concurrency: 12,
      activeJobs: 6,
      utilization: 50.0,
      platforms: 'OWASP DAST, API Security, Static Analysis',
      heartbeat: '1s ago'
    },
    {
      id: 'worker-04',
      name: 'US-West Self-Healing AI Worker',
      status: 'ONLINE',
      concurrency: 20,
      activeJobs: 3,
      utilization: 15.0,
      platforms: 'AI Failure Analyzer, Patch Generator, Autonomous Fixer',
      heartbeat: '1s ago'
    }
  ]);

  // 7. MCP Connections
  const [mcpConnections, setMcpConnections] = useState([
    {
      id: 'mcp-1',
      client: 'Antigravity IDE Agentic Session',
      type: 'ANTIGRAVITY',
      orgName: 'NovaQA Core Engineering',
      calls: 48,
      status: 'CONNECTED'
    },
    {
      id: 'mcp-2',
      client: 'Claude Desktop Pair Programming',
      type: 'CLAUDE',
      orgName: 'Acme Global Financial',
      calls: 24,
      status: 'CONNECTED'
    },
    {
      id: 'mcp-3',
      client: 'CI/CD Pipeline MCP Runner Bridge',
      type: 'GENERIC_MCP',
      orgName: 'NovaScale Health Tech',
      calls: 112,
      status: 'IDLE'
    }
  ]);

  // 8. Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'aud_101',
      action: 'ORGANIZATION_SUSPENDED',
      target: 'Organization: suspended-crypto',
      admin: 'Platform Admin',
      timestamp: 'Today at 10:15 AM',
      details: 'Violation of acceptable usage policy'
    },
    {
      id: 'aud_102',
      action: 'PLAN_CHANGED_BY_ADMIN',
      target: 'Organization: acme-financial',
      admin: 'Platform Admin',
      timestamp: 'Today at 09:00 AM',
      details: 'Upgraded to ENTERPRISE (Yearly)'
    },
    {
      id: 'aud_103',
      action: 'FEATURE_FLAG_UPDATED',
      target: 'FeatureFlag: AI_SELF_HEALING',
      admin: 'Platform Admin',
      timestamp: 'Yesterday',
      details: 'Enabled for PRO tier and above'
    },
    {
      id: 'aud_104',
      action: 'CREDITS_GRANTED',
      target: 'Organization: novascale-health',
      admin: 'Platform Admin',
      timestamp: '2 days ago',
      details: 'Granted $50.00 SLA courtesy credits'
    }
  ]);

  // Actions
  const handleSuspendOrg = () => {
    if (!suspendModalOrg) return;
    setOrganizations(
      organizations.map((org) =>
        org.id === suspendModalOrg.id ? { ...org, status: 'SUSPENDED' } : org
      )
    );
    setAuditLogs([
      {
        id: `aud_${Date.now()}`,
        action: 'ORGANIZATION_SUSPENDED',
        target: `Organization: ${suspendModalOrg.name}`,
        admin: 'Platform Owner',
        timestamp: 'Just now',
        details: suspendReason || 'Administrative suspension'
      },
      ...auditLogs
    ]);
    setSuspendModalOrg(null);
    setSuspendReason('');
  };

  const handleRestoreOrg = (orgId: string, orgName: string) => {
    setOrganizations(
      organizations.map((org) =>
        org.id === orgId ? { ...org, status: 'ACTIVE' } : org
      )
    );
    setAuditLogs([
      {
        id: `aud_${Date.now()}`,
        action: 'ORGANIZATION_RESTORED',
        target: `Organization: ${orgName}`,
        admin: 'Platform Owner',
        timestamp: 'Just now',
        details: 'Restored organization to ACTIVE status'
      },
      ...auditLogs
    ]);
  };

  const handleChangePlan = () => {
    if (!changePlanOrg) return;
    setOrganizations(
      organizations.map((org) =>
        org.id === changePlanOrg.id ? { ...org, tier: selectedNewPlan } : org
      )
    );
    setAuditLogs([
      {
        id: `aud_${Date.now()}`,
        action: 'PLAN_CHANGED_BY_ADMIN',
        target: `Organization: ${changePlanOrg.name}`,
        admin: 'Platform Owner',
        timestamp: 'Just now',
        details: `Changed plan from ${changePlanOrg.currentPlan} to ${selectedNewPlan}`
      },
      ...auditLogs
    ]);
    setChangePlanOrg(null);
  };

  const handleGrantCredits = () => {
    if (!grantCreditOrg) return;
    setAuditLogs([
      {
        id: `aud_${Date.now()}`,
        action: 'CREDITS_GRANTED',
        target: `Organization: ${grantCreditOrg.name}`,
        admin: 'Platform Owner',
        timestamp: 'Just now',
        details: `Granted $${creditAmount.toFixed(2)} credits: ${creditReason || 'Administrative grant'}`
      },
      ...auditLogs
    ]);
    setGrantCreditOrg(null);
    setCreditAmount(50);
    setCreditReason('');
    alert(`Successfully granted $${creditAmount} in credits to ${grantCreditOrg.name}!`);
  };

  const handleRefundPayment = () => {
    if (!refundModalPayment) return;
    setPayments(
      payments.map((p) =>
        p.id === refundModalPayment.id ? { ...p, status: 'REFUNDED' } : p
      )
    );
    setAuditLogs([
      {
        id: `aud_${Date.now()}`,
        action: 'PAYMENT_REFUNDED_BY_ADMIN',
        target: `Payment: ${refundModalPayment.ref}`,
        admin: 'Platform Owner',
        timestamp: 'Just now',
        details: `Refunded $${refundModalPayment.amount.toFixed(2)} on Paymob: ${refundReason || 'Customer requested'}`
      },
      ...auditLogs
    ]);
    setRefundModalPayment(null);
    setRefundReason('');
  };

  const handleToggleFeatureFlag = (key: string) => {
    setFeatureFlags(
      featureFlags.map((f) =>
        f.key === key ? { ...f, isEnabled: !f.isEnabled } : f
      )
    );
    const target = featureFlags.find((f) => f.key === key);
    setAuditLogs([
      {
        id: `aud_${Date.now()}`,
        action: 'FEATURE_FLAG_UPDATED',
        target: `FeatureFlag: ${key}`,
        admin: 'Platform Owner',
        timestamp: 'Just now',
        details: `Toggled state to ${!target?.isEnabled ? 'ENABLED' : 'DISABLED'}`
      },
      ...auditLogs
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 p-4 space-y-6 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 px-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                NovaQA Admin
              </h2>
              <span className="text-[10px] text-cyan-400 font-mono">PLATFORM OWNER</span>
            </div>
          </div>

          <nav className="space-y-0.5 text-xs font-semibold">
            {[
              { id: 'OVERVIEW', label: 'System Overview', icon: BarChart3 },
              { id: 'ORGS', label: 'Organizations', icon: Building2, badge: organizations.length },
              { id: 'USERS', label: 'Users & Roles', icon: Users, badge: users.length },
              { id: 'SUBSCRIPTIONS', label: 'Subscriptions', icon: CreditCard },
              { id: 'PAYMENTS', label: 'Payments & Paymob', icon: Receipt },
              { id: 'FEATURE_FLAGS', label: 'Feature Flags', icon: ToggleRight, badge: featureFlags.length },
              { id: 'HEALTH', label: 'System Health', icon: HeartPulse },
              { id: 'WORKERS', label: 'Execution Workers', icon: Cpu, badge: '4/4' },
              { id: 'MCP', label: 'MCP Connections', icon: Bot, badge: mcpConnections.length },
              { id: 'SECURITY', label: 'Security Findings', icon: ShieldCheck, badge: '2 Critical' },
              { id: 'AUDIT_LOGS', label: 'Audit Logs', icon: History }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as AdminSection)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <Link href="/dashboard" className="text-cyan-400 hover:underline flex items-center gap-1">
            Exit to App <ArrowUpRight className="h-3 w-3" />
          </Link>
          <span className="font-mono">v1.4.0-admin</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-h-screen">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Platform Owner Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time multi-tenant monitoring, infrastructure telemetry, billing lifecycle, and audited controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM HEALTHY
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECTION: SYSTEM METRICS (OVERVIEW)                                    */}
        {/* ===================================================================== */}
        {activeSection === 'OVERVIEW' && (
          <div className="space-y-8">
            {/* 10 Key Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Monthly Recurring (MRR)</span>
                <div className="text-xl font-extrabold text-white flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                  {metrics.mrr.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">+18.4% this month</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Revenue</span>
                <div className="text-xl font-extrabold text-white flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-cyan-400 shrink-0" />
                  {metrics.totalRevenue.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">All-time Paymob</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Active Organizations</span>
                <div className="text-xl font-extrabold text-white flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-purple-400 shrink-0" />
                  {metrics.activeOrganizations}
                </div>
                <span className="text-[10px] text-amber-400 font-mono">{metrics.suspendedOrganizations} suspended</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Active Users</span>
                <div className="text-xl font-extrabold text-white flex items-center gap-1">
                  <Users className="h-4 w-4 text-teal-400 shrink-0" />
                  {metrics.activeUsers.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">1.4% churn</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Daily Test Runs</span>
                <div className="text-xl font-extrabold text-white flex items-center gap-1">
                  <Activity className="h-4 w-4 text-blue-400 shrink-0" />
                  {metrics.dailyTestExecutions.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{metrics.passRatePercent}% pass rate</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Failed Tests (24h)</span>
                <div className="text-xl font-extrabold text-rose-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  {metrics.failedTests}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Self-healed 84%</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">AI Tokens Consumed</span>
                <div className="text-xl font-extrabold text-purple-400 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                  {(metrics.aiTokensUsed / 1000000).toFixed(1)}M
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Failure diagnosis</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Storage Allocated</span>
                <div className="text-xl font-extrabold text-white flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-cyan-400 shrink-0" />
                  {metrics.storageUsageGb} GB
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Traces & Videos</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Worker Utilization</span>
                <div className="text-xl font-extrabold text-white flex items-center gap-1">
                  <Cpu className="h-4 w-4 text-amber-400 shrink-0" />
                  {metrics.workerUtilizationPercent}%
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">4 grid nodes online</span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Live MCP Clients</span>
                <div className="text-xl font-extrabold text-cyan-400 flex items-center gap-1">
                  <Bot className="h-4 w-4 text-cyan-400 shrink-0" />
                  {metrics.activeMcpConnections}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Antigravity & Claude</span>
              </div>
            </div>

            {/* Organizations Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-400" />
                  Recent Organizations
                </h3>
                <button
                  onClick={() => setActiveSection('ORGS')}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  View All ({organizations.length}) <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300 font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Members</th>
                      <th className="px-4 py-3">MRR</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {organizations.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-bold text-white">
                          {org.name}
                          <span className="block text-[11px] font-mono text-slate-500">{org.slug}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                            {org.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              org.status === 'ACTIVE'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {org.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono">{org.membersCount}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-100">${org.mrr.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {org.status === 'ACTIVE' ? (
                            <button
                              onClick={() => setSuspendModalOrg({ id: org.id, name: org.name })}
                              className="px-2 py-1 text-xs rounded bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 transition"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestoreOrg(org.id, org.name)}
                              className="px-2 py-1 text-xs rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition"
                            >
                              Restore
                            </button>
                          )}
                          <button
                            onClick={() => setChangePlanOrg({ id: org.id, name: org.name, currentPlan: org.tier })}
                            className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:text-white transition"
                          >
                            Plan
                          </button>
                          <button
                            onClick={() => setGrantCreditOrg({ id: org.id, name: org.name })}
                            className="px-2 py-1 text-xs rounded bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 transition"
                          >
                            + Credits
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

        {/* ===================================================================== */}
        {/* SECTION: ORGANIZATIONS MANAGEMENT                                     */}
        {/* ===================================================================== */}
        {activeSection === 'ORGS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                All Platform Organizations ({organizations.length})
              </h2>
            </div>

            <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs text-slate-300 font-sans">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 font-mono">
                  <tr>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Projects</th>
                    <th className="px-4 py-3">MRR</th>
                    <th className="px-4 py-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold text-white">
                        {org.name}
                        <span className="block text-[11px] font-mono text-slate-500">{org.slug}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          {org.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            org.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {org.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{org.membersCount}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{org.projectsCount}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-100">${org.mrr.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {org.status === 'ACTIVE' ? (
                          <button
                            onClick={() => setSuspendModalOrg({ id: org.id, name: org.name })}
                            className="px-2 py-1 text-xs rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestoreOrg(org.id, org.name)}
                            className="px-2 py-1 text-xs rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => setChangePlanOrg({ id: org.id, name: org.name, currentPlan: org.tier })}
                          className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:text-white transition"
                        >
                          Change Plan
                        </button>
                        <button
                          onClick={() => setGrantCreditOrg({ id: org.id, name: org.name })}
                          className="px-2 py-1 text-xs rounded bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 transition"
                        >
                          + Credits
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: USERS & ROLES                                                */}
        {/* ===================================================================== */}
        {activeSection === 'USERS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-400" />
                Global Platform Users ({users.length})
              </h2>
            </div>

            <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs text-slate-300 font-sans">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 font-mono">
                  <tr>
                    <th className="px-4 py-3">User Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold text-white">{usr.name}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400">{usr.email}</td>
                      <td className="px-4 py-3 text-slate-300">{usr.orgName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          VERIFIED
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{usr.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: FEATURE FLAGS                                                */}
        {/* ===================================================================== */}
        {activeSection === 'FEATURE_FLAGS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ToggleRight className="h-5 w-5 text-cyan-400" />
                  Dynamic Platform Feature Flags
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant feature rollout across organizations without server redeployment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureFlags.map((flag) => (
                <div key={flag.key} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{flag.name}</h3>
                      <span className="text-[10px] font-mono text-cyan-400">{flag.key}</span>
                      <p className="text-xs text-slate-400 mt-1">{flag.description}</p>
                    </div>

                    <button
                      onClick={() => handleToggleFeatureFlag(flag.key)}
                      className={`p-1 rounded-full transition ${
                        flag.isEnabled ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    >
                      {flag.isEnabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800 text-slate-400">
                    <span>Min Tier: <strong>{flag.minTier}</strong></span>
                    <span>Rollout: <strong className="text-emerald-400">{flag.rollout}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: PAYMENTS & PAYMOB                                            */}
        {/* ===================================================================== */}
        {activeSection === 'PAYMENTS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                Global Paymob Payments & Transactions ({payments.length})
              </h2>
            </div>

            <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Merchant Reference</th>
                    <th className="px-4 py-3">Paymob Tx ID</th>
                    <th className="px-4 py-3 font-sans">Organization</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 font-sans">Date</th>
                    <th className="px-4 py-3 text-right font-sans">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold font-mono text-cyan-400">{p.merchantReference}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{p.paymobTransactionId}</td>
                      <td className="px-4 py-3 font-bold text-white">{p.orgName}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-100">${p.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'SUCCEEDED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : p.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.date}</td>
                      <td className="px-4 py-3 text-right">
                        {p.status === 'SUCCEEDED' && (
                          <button
                            onClick={() =>
                              setRefundModalPayment({
                                id: p.id,
                                ref: p.merchantReference,
                                amount: p.amount
                              })
                            }
                            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:text-rose-400 text-slate-300 transition"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: SYSTEM HEALTH & WORKERS                                      */}
        {/* ===================================================================== */}
        {(activeSection === 'HEALTH' || activeSection === 'WORKERS') && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              Autonomous Test Execution Workers & Grid Infrastructure
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workers.map((w) => (
                <div key={w.id} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{w.name}</h3>
                      <span className="text-[10px] font-mono text-cyan-400">{w.id}</span>
                      <p className="text-xs text-slate-400 mt-1">{w.platforms}</p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        w.status === 'BUSY'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Utilization</span>
                      <span className="text-cyan-400 font-bold">{w.utilization}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${w.utilization}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                    <span>Active: <strong>{w.activeJobs} / {w.concurrency}</strong> slots</span>
                    <span>Heartbeat: <strong className="text-emerald-400">{w.heartbeat}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: MCP CONNECTIONS                                              */}
        {/* ===================================================================== */}
        {activeSection === 'MCP' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-400" />
              Active MCP AI Agent Sessions ({mcpConnections.length})
            </h2>

            <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-sans">Client Session</th>
                    <th className="px-4 py-3">Client Type</th>
                    <th className="px-4 py-3 font-sans">Organization</th>
                    <th className="px-4 py-3">Tool Calls</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {mcpConnections.map((mcp) => (
                    <tr key={mcp.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold text-white">{mcp.client}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400">{mcp.type}</td>
                      <td className="px-4 py-3 text-slate-300">{mcp.orgName}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-100">{mcp.calls} calls</td>
                      <td className="px-4 py-3 font-mono">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            mcp.status === 'CONNECTED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {mcp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: AUDIT LOGS                                                   */}
        {/* ===================================================================== */}
        {activeSection === 'AUDIT_LOGS' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-400" />
              Immutable Administrative Audit Log
            </h2>

            <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3 font-sans">Target Entity</th>
                    <th className="px-4 py-3 font-sans">Admin Actor</th>
                    <th className="px-4 py-3 font-sans">Timestamp</th>
                    <th className="px-4 py-3 font-sans">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold font-mono text-cyan-400">{log.action}</td>
                      <td className="px-4 py-3 text-slate-200">{log.target}</td>
                      <td className="px-4 py-3 text-slate-300">{log.admin}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{log.timestamp}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: SUSPEND ORGANIZATION                                           */}
        {/* ===================================================================== */}
        {suspendModalOrg && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel rounded-2xl border border-rose-800 p-6 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setSuspendModalOrg(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Ban className="h-5 w-5 text-rose-400" />
                  Suspend Organization
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  You are about to suspend <strong>{suspendModalOrg.name}</strong>. All active test runners and API keys will be immediately frozen.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Suspension Reason (Audited)</label>
                <input
                  type="text"
                  placeholder="e.g. Terms violation, excessive rate abuse"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSuspendModalOrg(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendOrg}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: CHANGE PLAN                                                    */}
        {/* ===================================================================== */}
        {changePlanOrg && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 p-6 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setChangePlanOrg(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-cyan-400" />
                  Override Organization Plan
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Target: <strong>{changePlanOrg.name}</strong> (Current: {changePlanOrg.currentPlan})
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Select New Subscription Tier</label>
                <select
                  value={selectedNewPlan}
                  onChange={(e) => setSelectedNewPlan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="FREE">Free Community Tier ($0/mo)</option>
                  <option value="STARTER">Starter Tier ($29/mo)</option>
                  <option value="PRO">Professional Tier ($79/mo)</option>
                  <option value="TEAM">Team Collaborative Tier ($199/mo)</option>
                  <option value="BUSINESS">Business Enterprise Tier ($499/mo)</option>
                  <option value="ENTERPRISE">Enterprise Dedicated Tier ($999/mo)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setChangePlanOrg(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePlan}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  Apply Plan Override
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: GRANT CREDITS                                                  */}
        {/* ===================================================================== */}
        {grantCreditOrg && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 p-6 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setGrantCreditOrg(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-cyan-400" />
                  Grant Platform Courtesy Credits
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Issue dollar credits to <strong>{grantCreditOrg.name}</strong> for SLA or promotion.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Credit Amount ($ USD)</label>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Reason / Reference (Audited)</label>
                  <input
                    type="text"
                    placeholder="e.g. SLA compensation, beta incentive"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setGrantCreditOrg(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantCredits}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  Grant Credits
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: REFUND PAYMENT                                                 */}
        {/* ===================================================================== */}
        {refundModalPayment && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 p-6 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setRefundModalPayment(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-rose-400" />
                  Refund Paymob Payment
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Refund <strong>${refundModalPayment.amount.toFixed(2)}</strong> for reference <strong>{refundModalPayment.ref}</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Refund Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Accidental double charge, customer request"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setRefundModalPayment(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefundPayment}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Paymob Refund
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
