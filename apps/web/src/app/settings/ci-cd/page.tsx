'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Terminal,
  GitBranch,
  Copy,
  Check,
  Server,
  Shield,
  Play,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code2,
  Layers,
  Sparkles
} from 'lucide-react';

export default function CiCdIntegrationPage() {
  const [activeTab, setActiveTab] = useState<'GITHUB' | 'GITLAB' | 'JENKINS' | 'WEBHOOK' | 'CLI'>('GITHUB');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const githubWorkflow = `name: NovaQA Continuous Testing & CI Quality Gate

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Automated Test Matrix & Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Trigger NovaQA Regression & Security Gates
        run: |
          npx testing-platform test \\
            --suite regression \\
            --security \\
            --fail-on-critical \\
            --min-coverage 90
        env:
          NOVAQA_API_KEY: \${{ secrets.NOVAQA_API_KEY }}
          NOVAQA_PROJECT_ID: \${{ secrets.NOVAQA_PROJECT_ID }}

      - name: Export Executive Quality Report
        if: always()
        run: |
          npx testing-platform report --format HTML --output novaqa-report.html

      - name: Upload Test Report Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: novaqa-test-report
          path: novaqa-report.html`;

  const gitlabCiConfig = `stages:
  - test
  - quality-gate

novaqa_continuous_test:
  stage: test
  image: node:20
  script:
    - npx testing-platform test --suite regression --security --fail-on-critical --min-coverage 90
  variables:
    NOVAQA_API_KEY: $NOVAQA_API_KEY
    NOVAQA_PROJECT_ID: $NOVAQA_PROJECT_ID
  artifacts:
    when: always
    paths:
      - novaqa-report.html
    reports:
      junit: novaqa-junit.xml`;

  const jenkinsfileConfig = `pipeline {
    agent any
    environment {
        NOVAQA_API_KEY = credentials('novaqa-api-key')
        NOVAQA_PROJECT_ID = 'proj_enterprise_prod'
    }
    stages {
        stage('NovaQA Automated Quality Gates') {
            steps {
                sh '''
                    npx testing-platform test \\
                        --suite regression \\
                        --security \\
                        --fail-on-critical \\
                        --min-coverage 90
                '''
            }
        }
        stage('Generate Executive Report') {
            steps {
                sh 'npx testing-platform report --format HTML --output novaqa-report.html'
                archiveArtifacts artifacts: 'novaqa-report.html', fingerprint: true
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}`;

  const genericWebhookCurl = `# Trigger Continuous Test Run via API Webhook
curl -X POST https://api.novaqa.io/api/v1/test-runs \\
  -H "Authorization: Bearer $NOVAQA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "proj_enterprise_prod",
    "suiteType": "REGRESSION",
    "failOnCritical": true,
    "failOnSecurityCritical": true,
    "minCoveragePercent": 90,
    "ciContext": {
      "provider": "generic_webhook",
      "commitSha": "a1b2c3d4",
      "branch": "main",
      "buildUrl": "https://ci.example.com/build/492"
    }
  }'

# Poll CI Status Gate
curl https://api.novaqa.io/api/v1/test-runs/{testRunId}/status \\
  -H "Authorization: Bearer $NOVAQA_API_KEY"`;

  const cliDocs = `# 1. Initialize project configuration (.novaqa.json)
testing-platform project init

# 2. Discover routes, APIs, and topology
testing-platform discover

# 3. Run default test suite with CI exit code (0 = PASS, 1 = FAIL)
testing-platform test

# 4. Run specific regression suite
testing-platform test --suite regression

# 5. Run defensive SAST & DAST security audit
testing-platform test --security

# 6. Generate and export executive report in terminal or save file
testing-platform report --format HTML --output report.html`;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <GitBranch className="h-6 w-6 text-cyan-400" />
              Continuous Testing & CI/CD Pipelines
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-bold">
              Automated Gates
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Native integrations for GitHub Actions, GitLab CI, Jenkins, Webhooks, and the <code>testing-platform</code> CLI.
          </p>
        </div>

        <Link
          href="/schedules"
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
        >
          <Server className="h-3.5 w-3.5 text-cyan-400" />
          Cron Schedules
        </Link>
      </div>

      {/* CI Gate Rules Info Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          Configurable Pipeline Failure Gates
        </h3>
        <p className="text-xs text-slate-400">
          The CI pipeline automatically exits with code <code>1</code> (FAIL) and halts deployment whenever any enabled quality gate is breached:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-rose-400">Critical Test Failure</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Fails CI if any P0/Critical test fails.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-amber-400">High-Priority Failure</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Fails CI if high-priority assertions fail.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-cyan-400">Security Critical Finding</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Fails CI if critical SAST/DAST flaw is found.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-purple-400">Coverage Threshold</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Fails CI if total coverage drops below target %.</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('GITHUB')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'GITHUB' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          GitHub Actions
        </button>
        <button
          onClick={() => setActiveTab('GITLAB')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'GITLAB' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          GitLab CI
        </button>
        <button
          onClick={() => setActiveTab('JENKINS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'JENKINS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Jenkins Pipeline
        </button>
        <button
          onClick={() => setActiveTab('WEBHOOK')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'WEBHOOK' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Generic Webhook
        </button>
        <button
          onClick={() => setActiveTab('CLI')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'CLI' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          CLI Reference
        </button>
      </div>

      {/* Tab Code Viewer */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <Code2 className="h-4 w-4 text-cyan-400" />
            <span>
              {activeTab === 'GITHUB'
                ? '.github/workflows/novaqa.yml'
                : activeTab === 'GITLAB'
                ? '.gitlab-ci.yml'
                : activeTab === 'JENKINS'
                ? 'Jenkinsfile'
                : activeTab === 'WEBHOOK'
                ? 'HTTP cURL Webhook Payload'
                : 'CLI Quickstart'}
            </span>
          </div>

          <button
            onClick={() =>
              copyToClipboard(
                activeTab === 'GITHUB'
                  ? githubWorkflow
                  : activeTab === 'GITLAB'
                  ? gitlabCiConfig
                  : activeTab === 'JENKINS'
                  ? jenkinsfileConfig
                  : activeTab === 'WEBHOOK'
                  ? genericWebhookCurl
                  : cliDocs,
                activeTab
              )
            }
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            {copiedKey === activeTab ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
          {activeTab === 'GITHUB'
            ? githubWorkflow
            : activeTab === 'GITLAB'
            ? gitlabCiConfig
            : activeTab === 'JENKINS'
            ? jenkinsfileConfig
            : activeTab === 'WEBHOOK'
            ? genericWebhookCurl
            : cliDocs}
        </pre>
      </div>
    </div>
  );
}
