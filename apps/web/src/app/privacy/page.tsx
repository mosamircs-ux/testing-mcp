'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-12">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
          <Shield className="h-3.5 w-3.5" />
          LEGAL &amp; PRIVACY COMPLIANCE
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">
          Privacy Policy &amp; Terms of Service
        </h1>
        <p className="text-xs md:text-sm text-slate-400">
          Last updated: August 24, 2026 • Effective immediately for all NovaQA cloud and on-premise users.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-8 bg-slate-950/70 text-xs leading-relaxed text-slate-300">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-400" />
            1. Zero-Retention Financial Data Policy
          </h2>
          <p>
            NovaQA does not store, log, or process raw credit card numbers, CVVs, or bank credentials on any of our infrastructure. All payment processing is conducted directly through Paymob Unified Checkout under PCI-DSS Level 1 compliance with timing-safe HMAC SHA-512 cryptographic verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            2. Multi-Tenant Data Isolation
          </h2>
          <p>
            Customer test artifacts, DOM snapshots, network HAR recordings, video captures, and source code telemetry are strictly isolated using organization-scoped foreign keys and cryptographically verified role-based access control (RBAC). Data belonging to one organization is never accessible by another tenant.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-400" />
            3. AI Diagnostic Data Handling
          </h2>
          <p>
            Failure logs and stack traces transmitted to our AI failure analysis engine are sanitized to remove accidental authorization headers, secret API keys, and session cookies before LLM evaluation. Customer proprietary code is never used to train generalized foundation models without explicit consent.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
            4. Service Level &amp; Data Retention
          </h2>
          <p>
            Data retention is enforced dynamically according to each tenant's plan tier (7 days for Community, up to 365 days or Unlimited for Enterprise). Automated pruning tasks remove expired sandbox logs to preserve storage quotas and user privacy.
          </p>
        </section>
      </div>

      <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
        <Link href="/contact" className="hover:text-cyan-400">
          Have privacy questions? Contact our Data Protection Officer &rarr;
        </Link>
        <Link href="/docs" className="hover:text-cyan-400">
          Developer Documentation &rarr;
        </Link>
      </div>
    </div>
  );
}
