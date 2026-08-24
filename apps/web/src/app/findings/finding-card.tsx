'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GitPullRequest,
  Check,
  Copy,
  Wrench,
  ShieldCheck,
  RotateCcw,
  History,
  AlertTriangle,
  Play,
  FileCode,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export interface FindingCardProps {
  finding: any;
}

export function FindingCard({ finding }: FindingCardProps) {
  const [f, setFinding] = useState(finding);
  const [copied, setCopied] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>(() => {
    try {
      return typeof finding.fixHistory === 'string' ? JSON.parse(finding.fixHistory) : (finding.fixHistory || []);
    } catch {
      return [];
    }
  });

  const copyPatch = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApproveFix = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/v1/findings/${f.id}/approve-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved via web console' })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setFinding((prev: any) => ({
          ...prev,
          status: 'FIX_APPROVED',
          fixApproved: true
        }));
        // Refresh history
        const hRes = await fetch(`/api/v1/findings/${f.id}/history`);
        const hData = await hRes.json();
        if (hData.success) setHistory(hData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleVerifyFix = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/v1/findings/${f.id}/verify-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'FULL_REGRESSION' })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setFinding((prev: any) => ({
          ...prev,
          status: data.data.finalFindingStatus
        }));
        // Refresh history
        const hRes = await fetch(`/api/v1/findings/${f.id}/history`);
        const hData = await hRes.json();
        if (hData.success) setHistory(hData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'REAL_BUG':
      case 'BUG':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'TEST_FLAKINESS':
      case 'FLAKY_TEST':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'SELECTOR_DRIFT':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'TIMING_ISSUE':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'PERMISSION_ISSUE':
      case 'AUTHENTICATION_ISSUE':
        return 'bg-orange-950/80 text-orange-300 border-orange-800';
      case 'NETWORK_ISSUE':
      case 'ENVIRONMENT_ISSUE':
        return 'bg-red-950/80 text-red-300 border-red-800';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  let affectedFilesList: string[] = [];
  try {
    if (f.affectedFiles) {
      affectedFilesList = typeof f.affectedFiles === 'string' ? JSON.parse(f.affectedFiles) : f.affectedFiles;
    }
  } catch {}

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      {/* Header & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-850">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${categoryColor(f.category)}`}>
            {f.category}
          </span>

          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono border bg-slate-900 border-slate-800 text-slate-300">
            Severity: <strong className="text-slate-100">{f.severity}</strong>
          </span>

          {f.confidence && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono border bg-cyan-950/40 border-cyan-800/60 text-cyan-400 font-bold">
              {(f.confidence * 100).toFixed(0)}% Confidence
            </span>
          )}

          {f.regressionRisk && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                f.regressionRisk === 'HIGH'
                  ? 'bg-rose-950/50 text-rose-400 border-rose-850'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Risk: {f.regressionRisk}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
              f.status === 'RESOLVED'
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : f.status === 'FIX_APPROVED'
                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800'
                : f.status === 'AUTO_HEALED'
                ? 'bg-teal-950/80 text-teal-400 border-teal-800'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Status: {f.status}
          </span>

          <Link
            href={`/runs/${f.testRunId}`}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
          >
            Preview Run <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Title & Root Cause Analysis */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100">{f.title}</h3>
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-850 text-xs text-slate-300 space-y-1.5 leading-relaxed font-mono">
          <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
            ⚡ Root Cause Diagnostic:
          </div>
          <p>{f.rootCauseAnalysis}</p>
        </div>
      </div>

      {/* Affected Files & Code context */}
      {affectedFilesList.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-cyan-400" />
            Affected Codebase Artifacts:
          </div>
          <div className="flex flex-wrap gap-2">
            {affectedFilesList.map((file, i) => (
              <span key={i} className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Fix */}
      {f.suggestedFix && (
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold text-slate-400">Actionable Remediation Strategy:</div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-200">
            {f.suggestedFix}
          </div>
        </div>
      )}

      {/* Suggested Patch Diff with Copy */}
      {f.suggestedPatch && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
              <GitPullRequest className="h-3.5 w-3.5 text-cyan-400" />
              Proposed Code Fix Patch (Unified Diff):
            </div>
            <button
              onClick={() => copyPatch(f.suggestedPatch)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Patch'}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-900 whitespace-pre">
            {f.suggestedPatch}
          </pre>
        </div>
      )}

      {/* Actions Bar: Approve Patch, Verify Fix, View History */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-850">
        <div className="flex items-center gap-2">
          {f.status !== 'RESOLVED' && f.status !== 'FIX_APPROVED' && (
            <button
              onClick={handleApproveFix}
              disabled={isApproving}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-mono font-bold hover:bg-cyan-400 shadow-glow flex items-center gap-1.5 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              {isApproving ? 'Approving...' : 'Approve Fix Patch'}
            </button>
          )}

          {f.status !== 'RESOLVED' && (
            <button
              onClick={handleVerifyFix}
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
              {isVerifying ? 'Running Verification Pipeline...' : 'Run Fix Verification Suite'}
            </button>
          )}

          {f.status === 'RESOLVED' && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Fix Verified & Resolved Across Regression Suite
            </div>
          )}
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
        >
          <History className="h-3.5 w-3.5" />
          Audit History ({history.length})
        </button>
      </div>

      {/* Collapsible Fix History Timeline */}
      {showHistory && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2 text-xs font-mono">
          <div className="font-bold text-slate-400 mb-2">Fix Lifecycle Audit Trail:</div>
          {history.length === 0 ? (
            <p className="text-slate-600">No history recorded yet.</p>
          ) : (
            history.map((h, idx) => (
              <div key={idx} className="flex items-start justify-between border-b border-slate-900 pb-1.5">
                <div>
                  <span className="text-cyan-400 font-bold">[{h.action}]</span>{' '}
                  <span className="text-slate-300">{h.details}</span>
                  <span className="text-slate-500 text-[10px] block">By {h.actor}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : ''}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
