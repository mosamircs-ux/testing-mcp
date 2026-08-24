'use client';

import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Lock,
  FileCode2,
  Globe,
  Terminal,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Key,
  Database,
  Code2,
  X
} from 'lucide-react';

interface SecurityFinding {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  category: string;
  cwe?: string;
  affectedComponent: string;
  evidence: string;
  reproductionSteps: string[];
  risk: string;
  remediation: string;
  references: string[];
  status?: string;
}

export default function SecurityDashboardPage() {
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000');
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);

  // Initial rich demonstration findings
  const [findings, setFindings] = useState<SecurityFinding[]>([
    {
      id: 'SEC-JWT-001',
      title: 'JWT Algorithm Confusion and Weak Signature Acceptance',
      severity: 'CRITICAL',
      category: 'JWT_CONFIGURATION',
      cwe: 'CWE-347',
      affectedComponent: '/api/v1/user/profile',
      evidence: 'JWT accepted with "alg": "none" header or lacking proper cryptographic signature validation on server.',
      reproductionSteps: [
        '1. Construct unsigned JWT token with {"alg":"none","typ":"JWT"} header',
        '2. Transmit token in Authorization header: Bearer <unsigned_jwt> to /api/v1/user/profile',
        '3. Observe server accepting payload without throwing 401 Unauthorized'
      ],
      risk: 'An attacker can forge arbitrary user IDs and administrative claims, completely bypassing application authentication.',
      remediation: "Explicitly restrict accepted JWT verification algorithms (e.g. algorithms: ['HS256', 'RS256']) and enforce asymmetric key verification.",
      references: [
        'https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/',
        'https://cwe.mitre.org/data/definitions/347.html'
      ]
    },
    {
      id: 'SAST-SEC-001',
      title: 'Hardcoded AWS Cloud Access Key in Source Code',
      severity: 'CRITICAL',
      category: 'SAST_HARDCODED_SECRET',
      cwe: 'CWE-798',
      affectedComponent: 'src/config/aws.ts:14',
      evidence: 'const awsKey = "AKIA1234567890ABCDEF"; // Production S3 storage credentials',
      reproductionSteps: [
        '1. Inspect file src/config/aws.ts at line 14',
        '2. Verify plaintext AWS IAM access key ID committed to source'
      ],
      risk: 'Exposing AWS cloud keys allows attackers to compromise cloud infrastructure, access S3 buckets, and manipulate production cloud instances.',
      remediation: 'Immediately rotate credentials in AWS IAM console, revoke exposed key, and load from process.env.AWS_ACCESS_KEY_ID.',
      references: [
        'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
        'https://cwe.mitre.org/data/definitions/798.html'
      ]
    },
    {
      id: 'SEC-INJ-002',
      title: 'SQL Syntax Error Disclosed in Response Body (SQLi Indicator)',
      severity: 'CRITICAL',
      category: 'SQL_INJECTION',
      cwe: 'CWE-89',
      affectedComponent: '/api/v1/items?sortBy=',
      evidence: "Single quote input ' resulted in HTTP 500 containing 'SQLITE_ERROR: unrecognized token' stack trace.",
      reproductionSteps: [
        "1. Send GET /api/v1/items?sortBy='",
        '2. Inspect response body',
        '3. Observe raw database dialect error string disclosed'
      ],
      risk: 'Dynamic query construction with unescaped user parameters exposes the backend database to full unauthorized data extraction, modification, or deletion.',
      remediation: 'Use parameterized queries, ORM prepared statements (Prisma/TypeORM), and strict input validation whitelisting.',
      references: [
        'https://owasp.org/www-community/attacks/SQL_Injection',
        'https://cwe.mitre.org/data/definitions/89.html'
      ]
    },
    {
      id: 'SEC-IDOR-001',
      title: 'Insecure Direct Object Reference (IDOR) on User Resource',
      severity: 'HIGH',
      category: 'IDOR',
      cwe: 'CWE-639',
      affectedComponent: '/api/v1/projects/:projectId',
      evidence: 'Authenticated user from Organization A can access and inspect metadata for Project ID owned by Organization B.',
      reproductionSteps: [
        '1. Log in with User A (Tenant A) and acquire access token',
        '2. Send GET /api/v1/projects/tenant-b-project-991 with User A token',
        '3. Verify response returns 200 OK with Tenant B private metadata'
      ],
      risk: 'Allows horizontal privilege escalation where unauthorized users can access or tamper with data belonging to other tenants.',
      remediation: 'Enforce tenant-scoping in every database query (e.g. where: { id: projectId, organizationId: context.organizationId }).',
      references: [
        'https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control',
        'https://cwe.mitre.org/data/definitions/639.html'
      ]
    },
    {
      id: 'SEC-CORS-001',
      title: 'Overly Permissive CORS Origin Reflection',
      severity: 'HIGH',
      category: 'CORS',
      cwe: 'CWE-942',
      affectedComponent: '/api/v1/data',
      evidence: 'Request with Origin: "https://attacker-domain.com" reflected back in Access-Control-Allow-Origin with Access-Control-Allow-Credentials: true.',
      reproductionSteps: [
        "1. Send HTTP OPTIONS or GET request to /api/v1/data with header 'Origin: https://evil.example.com'",
        '2. Observe response containing Access-Control-Allow-Origin: https://evil.example.com and Access-Control-Allow-Credentials: true'
      ],
      risk: 'Allows malicious third-party websites visited by an authenticated user to perform unauthorized cross-origin credentialed data extraction.',
      remediation: 'Implement an explicit whitelist of trusted domains for CORS headers instead of dynamically echoing the incoming Origin header.',
      references: [
        'https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny',
        'https://cwe.mitre.org/data/definitions/942.html'
      ]
    },
    {
      id: 'SEC-HDR-001',
      title: 'Missing Content-Security-Policy (CSP) Header',
      severity: 'MEDIUM',
      category: 'SECURITY_HEADERS',
      cwe: 'CWE-1021',
      affectedComponent: 'https://app.novaqa.io/',
      evidence: 'Response headers do not include a "Content-Security-Policy" directive.',
      reproductionSteps: [
        '1. Send HTTP GET request to /',
        '2. Inspect response headers',
        '3. Verify absence of "Content-Security-Policy"'
      ],
      risk: 'Without a robust CSP, browsers cannot restrict unauthorized script execution or resource loading, increasing vulnerability to Cross-Site Scripting (XSS).',
      remediation: "Configure Content-Security-Policy with strict script-src, object-src 'none', and base-uri directives.",
      references: [
        'https://owasp.org/www-project-secure-headers/#content-security-policy',
        'https://cwe.mitre.org/data/definitions/1021.html'
      ]
    }
  ]);

  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length;
  const highCount = findings.filter((f) => f.severity === 'HIGH').length;
  const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length;
  const lowCount = findings.filter((f) => f.severity === 'LOW').length;

  const deductions = criticalCount * 25 + highCount * 10 + mediumCount * 4 + lowCount * 1;
  const postureScore = Math.max(0, Math.min(100, 100 - deductions));

  let grade = 'A+';
  if (postureScore >= 95) grade = 'A+';
  else if (postureScore >= 90) grade = 'A';
  else if (postureScore >= 80) grade = 'B';
  else if (postureScore >= 70) grade = 'C';
  else if (postureScore >= 60) grade = 'D';
  else grade = 'F';

  const filteredFindings = findings.filter((f) => {
    const matchesTab = activeTab === 'ALL' || f.severity === activeTab;
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.affectedComponent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.cwe?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleRunScan = async (type: 'DAST' | 'SAST' | 'FULL') => {
    setIsScanning(true);
    try {
      // Simulate live scan trigger
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Application Security & Posture Audit
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  Defensive SAST + DAST
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Safe vulnerability identification, OWASP Top 10 checks, and CWE-mapped remediation advice.
              </p>
            </div>
          </div>
        </div>

        {/* Scan Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunScan('DAST')}
            disabled={isScanning}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2"
          >
            <Globe className="h-4 w-4 text-cyan-400" />
            Scan API Endpoints
          </button>
          <button
            onClick={() => handleRunScan('SAST')}
            disabled={isScanning}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2"
          >
            <Code2 className="h-4 w-4 text-amber-400" />
            Scan Source Code
          </button>
          <button
            onClick={() => handleRunScan('FULL')}
            disabled={isScanning}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Auditing Target...' : 'Run Full AppSec Audit'}
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Posture Score & Grade Card */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Security Posture</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-white">{postureScore}</span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {postureScore < 60 ? 'Immediate remediation required' : 'Strong defensive baseline'}
            </p>
          </div>
          <div
            className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl border ${
              grade === 'A+' || grade === 'A'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60'
                : grade === 'B' || grade === 'C'
                ? 'bg-amber-950/60 text-amber-400 border-amber-700/60'
                : 'bg-rose-950/60 text-rose-400 border-rose-700/60'
            }`}
          >
            {grade}
          </div>
        </div>

        {/* Critical Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-rose-950/60 flex flex-col justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            Critical
          </span>
          <span className="text-3xl font-extrabold text-white mt-2">{criticalCount}</span>
          <span className="text-[11px] text-slate-500 mt-1">Immediate exploit risk</span>
        </div>

        {/* High Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-950/60 flex flex-col justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            High
          </span>
          <span className="text-3xl font-extrabold text-white mt-2">{highCount}</span>
          <span className="text-[11px] text-slate-500 mt-1">Significant exposure</span>
        </div>

        {/* Medium Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-yellow-950/60 flex flex-col justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-yellow-400 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-yellow-500" />
            Medium
          </span>
          <span className="text-3xl font-extrabold text-white mt-2">{mediumCount}</span>
          <span className="text-[11px] text-slate-500 mt-1">Config & header drift</span>
        </div>

        {/* Total Scanned */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500" />
            Total Checks
          </span>
          <span className="text-3xl font-extrabold text-white mt-2">48</span>
          <span className="text-[11px] text-slate-500 mt-1">100% Non-destructive</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2 w-full md:w-96 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by title, CWE, component, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
          />
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === tab
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Findings Table List */}
        <div className={`space-y-3 ${selectedFinding ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => setSelectedFinding(finding)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                selectedFinding?.id === finding.id
                  ? 'bg-slate-800/80 border-cyan-500 shadow-glow'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`mt-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    finding.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : finding.severity === 'HIGH'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-yellow-950 text-yellow-300 border-yellow-800'
                  }`}
                >
                  {finding.severity}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{finding.title}</h3>
                    {finding.cwe && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {finding.cwe}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                    <span>{finding.affectedComponent}</span>
                    <span>•</span>
                    <span className="text-slate-500">{finding.category}</span>
                  </div>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
            </div>
          ))}

          {filteredFindings.length === 0 && (
            <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-sm">
              No security findings match your active filters.
            </div>
          )}
        </div>

        {/* Finding Detail Inspector Drawer */}
        {selectedFinding && (
          <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <button
              onClick={() => setSelectedFinding(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${
                    selectedFinding.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {selectedFinding.severity}
                </span>
                <span className="text-xs font-mono text-cyan-400">{selectedFinding.cwe}</span>
                <span className="text-xs text-slate-500 font-mono">ID: {selectedFinding.id}</span>
              </div>

              <h2 className="text-lg font-bold text-white leading-snug">{selectedFinding.title}</h2>

              {/* Affected Component */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Affected Target
                </label>
                <div className="mt-1 p-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 break-all">
                  {selectedFinding.affectedComponent}
                </div>
              </div>

              {/* Evidence Snippet */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Observed Evidence
                </label>
                <pre className="mt-1 p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedFinding.evidence}
                </pre>
              </div>

              {/* Reproduction Steps */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Reproduction Steps
                </label>
                <ul className="mt-1 space-y-1 text-xs text-slate-300">
                  {selectedFinding.reproductionSteps.map((step, idx) => (
                    <li key={idx} className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Impact / Risk */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  Risk & Threat Analysis
                </label>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed bg-rose-950/20 p-3 rounded border border-rose-950/40">
                  {selectedFinding.risk}
                </p>
              </div>

              {/* Remediation Guide */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Actionable Remediation
                </label>
                <p className="mt-1 text-xs text-slate-200 leading-relaxed bg-emerald-950/20 p-3 rounded border border-emerald-950/40 font-mono">
                  {selectedFinding.remediation}
                </p>
              </div>

              {/* References */}
              {selectedFinding.references.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    References & Standards
                  </label>
                  <div className="mt-1 space-y-1">
                    {selectedFinding.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1.5"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {ref}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
