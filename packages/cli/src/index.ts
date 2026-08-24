#!/usr/bin/env node

import { cliRunner } from './cli-runner.js';
import { ReportType, ReportFormat } from '@novaqa/reporting';

export * from './cli-runner.js';

export async function runCli(args: string[] = process.argv.slice(2)): Promise<number> {
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
NovaQA Autonomous Testing Platform CLI (testing-platform)

Usage:
  testing-platform project init            Initialize a new .novaqa.json configuration
  testing-platform discover                Discover routes, APIs, and topology
  testing-platform test                    Run default test suite
  testing-platform test --suite <name>     Run specific suite (e.g. regression, smoke)
  testing-platform test --security         Run defensive SAST/DAST security tests
  testing-platform report                  Generate and export executive test report

Flags:
  --suite <name>       Target test suite (smoke, regression, api, security)
  --security           Enable security vulnerability checks
  --fail-on-critical   Fail process if any critical test/finding fails (default: true)
  --min-coverage <pct> Minimum coverage threshold percentage (default: 85)
  --format <fmt>       Report format: PDF | HTML | JSON | CSV
  --output <path>      Save output report to file path
`);
    return 0;
  }

  try {
    if (command === 'project' && args[1] === 'init') {
      const res = await cliRunner.projectInit();
      console.log(res.message);
      return 0;
    }

    if (command === 'discover') {
      console.log('🔍 Initiating Autonomous Project Discovery...');
      const res = await cliRunner.discover();
      console.log(`✅ ${res.specificationSummary}`);
      return 0;
    }

    if (command === 'test') {
      const suiteIdx = args.indexOf('--suite');
      const suite = suiteIdx !== -1 ? args[suiteIdx + 1] : undefined;
      const isSecurity = args.includes('--security');
      const minCoverageIdx = args.indexOf('--min-coverage');
      const minCoverage = minCoverageIdx !== -1 ? Number(args[minCoverageIdx + 1]) : 85;

      console.log(`🚀 Starting Test Execution (${isSecurity ? 'Security Audit' : suite ? `Suite: ${suite}` : 'Default Suite'})...`);
      const res = await cliRunner.test({
        suite,
        security: isSecurity,
        minCoverage
      });

      console.log(`\n========================================`);
      console.log(`CI Status: ${res.ciStatus === 'PASS' ? '✅ PASS' : '❌ ' + res.ciStatus}`);
      console.log(`Total Tests: ${res.totalTests} | Passed: ${res.passedTests} | Failed: ${res.failedTests}`);
      console.log(`Duration: ${(res.durationMs / 1000).toFixed(1)}s`);
      console.log(`========================================\n`);

      if (res.failureReasons.length > 0) {
        console.error('Failure Reasons:');
        res.failureReasons.forEach((r) => console.error(` - ${r}`));
      }

      return res.exitCode;
    }

    if (command === 'report') {
      const formatIdx = args.indexOf('--format');
      const format = (formatIdx !== -1 ? args[formatIdx + 1].toUpperCase() : 'HTML') as ReportFormat;
      const outputIdx = args.indexOf('--output');
      const output = outputIdx !== -1 ? args[outputIdx + 1] : undefined;

      console.log('📊 Generating Executive Report...');
      const res = await cliRunner.report({
        format,
        output
      });

      console.log(`✅ Generated Report: ${res.title} (${res.reportId})`);
      if (res.filePath) {
        console.log(`📁 Saved to: ${res.filePath}`);
      }
      return 0;
    }

    console.error(`Unknown command: ${command}. Use --help to view available commands.`);
    return 1;
  } catch (err: any) {
    console.error(`Error executing testing-platform ${command}:`, err.message || err);
    return 1;
  }
}

// Run CLI when invoked directly
if (typeof require !== 'undefined' && require.main === module) {
  runCli().then((code) => process.exit(code));
}
