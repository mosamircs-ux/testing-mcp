import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import {
  handleProjectCreate,
  handleProjectList,
  handleProjectGet,
  handleProjectDiscover,
  handleApplicationMapGet,
  handleApiMapGet,
  handleRequirementsGet,
  handleTestPlanGenerate,
  handleTestList,
  handleTestGet,
  handleTestCreate,
  handleTestUpdate,
  handleTestDelete,
  handleTestRun,
  handleTestRunSuite,
  handleTestRunSingle,
  handleTestCancel,
  handleTestRetry,
  handleRegressionRun,
  handleTestResultGet,
  handleTestResultList,
  handleArtifactsList,
  handleArtifactGet,
  handleCoverageGet,
  handleReportGenerate,
  handleFailureAnalyze,
  handleFailureGet,
  handleFixGenerate,
  handleFixApply,
  handleFixVerify,
  handleEnvironmentList,
  handleEnvironmentCreate,
  handleHealthCheck,
  handleProjectAutoTest,
  handleMobileDeviceList,
  handleMobileScenarioGenerate,
  handleMobileCrashInspect
} from './tools.js';
import { prisma } from '@novaqa/database';
import { createChildLogger } from '@novaqa/shared';
import { sanitizeMcpOutput } from './auth.js';

const log = createChildLogger('mcp-server');

export function createMcpServer() {
  const server = new Server(
    {
      name: 'NovaQA Production MCP Server',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    }
  );

  // 1. Tool Listing (All 31 tools + aliases)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // Project Management & Discovery
        {
          name: 'project_create',
          description: 'Create a new project workspace in NovaQA with target URL and default test suite.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Project display name' },
              slug: { type: 'string', description: 'Unique project slug' },
              category: { type: 'string', description: 'WEB | REST_API | GRAPHQL_API | MOBILE_APP' },
              engineType: { type: 'string', description: 'PLAYWRIGHT_WEB | API_REST | API_GRAPHQL | MOBILE_HARNESS' },
              baseUrl: { type: 'string', description: 'Base application URL' },
              repositoryUrl: { type: 'string', description: 'GitHub / GitLab repo URL' },
              description: { type: 'string' }
            },
            required: ['name']
          }
        },
        {
          name: 'project_list',
          description: 'List all projects, environments, suites, and recent test run metrics in the tenant organization.',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'project_get',
          description: 'Get full project details, suites, test cases, and recent execution findings.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string', description: 'Unique ID of the project' }
            },
            required: ['projectId']
          }
        },
        {
          name: 'project_discover',
          description: 'Autonomously crawl & discover application routes, API schemas, user journeys, workflows, and risk areas.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              targetUrl: { type: 'string' },
              repositoryContext: { type: 'string' }
            },
            required: ['projectId']
          }
        },
        {
          name: 'application_map_get',
          description: 'Retrieve the discovered frontend UI route hierarchy, page map, and component interactables.',
          inputSchema: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId']
          }
        },
        {
          name: 'api_map_get',
          description: 'Retrieve the discovered backend API endpoints, HTTP methods, parameters, and contract schemas.',
          inputSchema: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId']
          }
        },
        {
          name: 'requirements_get',
          description: 'Retrieve the normalized business requirements matrix and feature specifications.',
          inputSchema: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId']
          }
        },

        // Test Planning & Authoring
        {
          name: 'test_plan_generate',
          description: 'Generate a comprehensive, AI-planned test suite across 19 categories with coverage metrics.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              featureDescription: { type: 'string', description: 'Feature requirement or story' },
              targetUrl: { type: 'string' },
              categories: { type: 'array', items: { type: 'string' } }
            },
            required: ['projectId']
          }
        },
        {
          name: 'test_list',
          description: 'List all test cases in a project or suite with priority, flakiness score, and steps summary.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              suiteId: { type: 'string' }
            }
          }
        },
        {
          name: 'test_get',
          description: 'Get full test case definition, step sequence (NAVIGATE, CLICK, TYPE, ASSERT), and expected outputs.',
          inputSchema: {
            type: 'object',
            properties: { testCaseId: { type: 'string' } },
            required: ['testCaseId']
          }
        },
        {
          name: 'test_create',
          description: 'Create an executable test case with structured steps.',
          inputSchema: {
            type: 'object',
            properties: {
              suiteId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
              expectedResult: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    order: { type: 'number' },
                    action: { type: 'string' },
                    target: { type: 'string' },
                    value: { type: 'string' },
                    description: { type: 'string' },
                    expectedOutput: { type: 'string' }
                  },
                  required: ['order', 'action', 'description']
                }
              }
            },
            required: ['suiteId', 'title', 'expectedResult', 'steps']
          }
        },
        {
          name: 'test_update',
          description: 'Update test case properties, steps, or priority.',
          inputSchema: {
            type: 'object',
            properties: {
              testCaseId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
              expectedResult: { type: 'string' }
            },
            required: ['testCaseId']
          }
        },
        {
          name: 'test_delete',
          description: 'Delete a test case from a suite.',
          inputSchema: {
            type: 'object',
            properties: { testCaseId: { type: 'string' } },
            required: ['testCaseId']
          }
        },

        // Test Execution & Control
        {
          name: 'test_run',
          description: 'Execute automated tests on real sandbox environments (Playwright, API, Mobile) and return execution summary.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              suiteId: { type: 'string' },
              environmentId: { type: 'string' }
            },
            required: ['projectId']
          }
        },
        {
          name: 'test_run_suite',
          description: 'Execute all test cases in a specific test suite.',
          inputSchema: {
            type: 'object',
            properties: {
              suiteId: { type: 'string' },
              environmentId: { type: 'string' }
            },
            required: ['suiteId']
          }
        },
        {
          name: 'test_run_single',
          description: 'Execute an isolated single test case in sandbox.',
          inputSchema: {
            type: 'object',
            properties: {
              testCaseId: { type: 'string' },
              environmentId: { type: 'string' }
            },
            required: ['testCaseId']
          }
        },
        {
          name: 'test_cancel',
          description: 'Cancel an in-flight test execution run.',
          inputSchema: {
            type: 'object',
            properties: {
              runId: { type: 'string' },
              reason: { type: 'string' }
            },
            required: ['runId']
          }
        },
        {
          name: 'test_retry',
          description: 'Retry failed or flaky tests in a run.',
          inputSchema: {
            type: 'object',
            properties: {
              runId: { type: 'string' },
              failedOnly: { type: 'boolean' }
            },
            required: ['runId']
          }
        },
        {
          name: 'regression_run',
          description: 'Execute full multi-suite regression test run for the project.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              environmentId: { type: 'string' }
            },
            required: ['projectId']
          }
        },

        // Results, Artifacts & Coverage
        {
          name: 'test_result_get',
          description: 'Get detailed result of a test case execution, including duration, error, and step breakdown.',
          inputSchema: {
            type: 'object',
            properties: { testResultId: { type: 'string' } },
            required: ['testResultId']
          }
        },
        {
          name: 'test_result_list',
          description: 'List all test results for a test run.',
          inputSchema: {
            type: 'object',
            properties: { runId: { type: 'string' } },
            required: ['runId']
          }
        },
        {
          name: 'artifacts_list',
          description: 'List artifacts (screenshots, traces, logs, network HAR) captured during test execution.',
          inputSchema: {
            type: 'object',
            properties: {
              runId: { type: 'string' },
              testResultId: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        {
          name: 'artifact_get',
          description: 'Get storage URL, metadata, and download details for a specific artifact.',
          inputSchema: {
            type: 'object',
            properties: { artifactId: { type: 'string' } },
            required: ['artifactId']
          }
        },
        {
          name: 'coverage_get',
          description: 'Retrieve requirements, route, and API endpoint test coverage percentages.',
          inputSchema: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId']
          }
        },
        {
          name: 'report_generate',
          description: 'Generate executive summary Markdown / JSON report for a test run.',
          inputSchema: {
            type: 'object',
            properties: {
              runId: { type: 'string' },
              format: { type: 'string', enum: ['markdown', 'json'] }
            },
            required: ['runId']
          }
        },

        // AI Failure Triage, Fixes & Verification
        {
          name: 'failure_analyze',
          description: 'Perform deep multi-signal failure root cause analysis across 10 categories (REAL_BUG, SELECTOR_DRIFT, etc.).',
          inputSchema: {
            type: 'object',
            properties: {
              runId: { type: 'string' },
              testResultId: { type: 'string' }
            }
          }
        },
        {
          name: 'failure_get',
          description: 'Get finding root cause analysis, confidence, regression risk, and suggested patch.',
          inputSchema: {
            type: 'object',
            properties: { findingId: { type: 'string' } },
            required: ['findingId']
          }
        },
        {
          name: 'fix_generate',
          description: 'Generate proposed unified git diff patch for an identified defect.',
          inputSchema: {
            type: 'object',
            properties: { findingId: { type: 'string' } },
            required: ['findingId']
          }
        },
        {
          name: 'fix_apply',
          description: 'Explicitly approve and apply a proposed code fix patch or self-heal update.',
          inputSchema: {
            type: 'object',
            properties: {
              findingId: { type: 'string' },
              patchOverride: { type: 'string' },
              notes: { type: 'string' }
            },
            required: ['findingId']
          }
        },
        {
          name: 'fix_verify',
          description: 'Execute the 4-stage fix verification pipeline (rerun failed -> related -> regression) before resolving a finding.',
          inputSchema: {
            type: 'object',
            properties: {
              findingId: { type: 'string' },
              scope: { type: 'string', enum: ['FAILED_TEST_ONLY', 'RELATED_SUITE', 'FULL_REGRESSION'] }
            },
            required: ['findingId']
          }
        },

        // Environment & System Health
        {
          name: 'environment_list',
          description: 'List environments configured for a project.',
          inputSchema: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId']
          }
        },
        {
          name: 'environment_create',
          description: 'Create a new testing environment (e.g. Staging, QA, Prod).',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              name: { type: 'string' },
              baseUrl: { type: 'string' },
              variables: { type: 'object' }
            },
            required: ['projectId', 'name', 'baseUrl']
          }
        },
        {
          name: 'health_check',
          description: 'Check MCP server health, database connectivity, and engine readiness.',
          inputSchema: { type: 'object', properties: {} }
        },

        // Project Context Understanding ("Test this project" Autonomous Pipeline)
        {
          name: 'project_auto_test',
          description: 'Autonomous 10-step pipeline: Identify project -> Inspect config -> Discover app -> Build spec -> Generate plan -> Generate tests -> Execute tests -> Analyze failures -> Produce report -> Provide fixes.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              targetUrl: { type: 'string' },
              repositoryContext: { type: 'string' }
            }
          }
        },

        // Mobile Testing & Device Farm
        {
          name: 'mobile_device_list',
          description: 'List available Android Emulators, iOS Simulators, and mobile worker execution devices in the pool.',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'mobile_scenario_generate',
          description: 'Autonomously synthesize comprehensive mobile test scenarios (Login, Onboarding, Permissions, Deep Links, Push, Offline, Payments).',
          inputSchema: {
            type: 'object',
            properties: {
              appName: { type: 'string' },
              framework: { type: 'string', enum: ['REACT_NATIVE', 'FLUTTER', 'NATIVE_ANDROID', 'NATIVE_IOS', 'CORDOVA_IONIC'] },
              platform: { type: 'string', enum: ['ANDROID', 'IOS'] },
              appPackageOrBundle: { type: 'string' },
              deepLinkScheme: { type: 'string' }
            },
            required: ['appName']
          }
        },
        {
          name: 'mobile_crash_inspect',
          description: 'Inspect device logcat / syslog artifacts for fatal native crashes and ANR (Application Not Responding) events.',
          inputSchema: {
            type: 'object',
            properties: {
              testRunId: { type: 'string' },
              testResultId: { type: 'string' }
            }
          }
        }
      ]
    };
  });

  // 2. Tool Execution Router
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    log.info({ tool: name }, 'MCP tool call received');

    try {
      switch (name) {
        // Project Management
        case 'project_create':
        case 'nova_project_create':
          return await handleProjectCreate(args as any);
        case 'project_list':
        case 'nova_list_projects':
          return await handleProjectList(args as any);
        case 'project_get':
        case 'nova_project_get':
          return await handleProjectGet(args as any);
        case 'project_discover':
        case 'nova_analyze_project':
          return await handleProjectDiscover(args as any);
        case 'application_map_get':
          return await handleApplicationMapGet(args as any);
        case 'api_map_get':
          return await handleApiMapGet(args as any);
        case 'requirements_get':
          return await handleRequirementsGet(args as any);

        // Test Planning & Authoring
        case 'test_plan_generate':
        case 'nova_generate_test_plan':
          return await handleTestPlanGenerate(args as any);
        case 'test_list':
          return await handleTestList(args as any);
        case 'test_get':
          return await handleTestGet(args as any);
        case 'test_create':
          return await handleTestCreate(args as any);
        case 'test_update':
          return await handleTestUpdate(args as any);
        case 'test_delete':
          return await handleTestDelete(args as any);

        // Test Execution & Control
        case 'test_run':
        case 'nova_execute_test_run':
          return await handleTestRun(args as any);
        case 'test_run_suite':
          return await handleTestRunSuite(args as any);
        case 'test_run_single':
          return await handleTestRunSingle(args as any);
        case 'test_cancel':
          return await handleTestCancel(args as any);
        case 'test_retry':
          return await handleTestRetry(args as any);
        case 'regression_run':
          return await handleRegressionRun(args as any);

        // Results, Artifacts & Coverage
        case 'test_result_get':
          return await handleTestResultGet(args as any);
        case 'test_result_list':
        case 'nova_get_test_run_status':
          return await handleTestResultList(args as any);
        case 'artifacts_list':
          return await handleArtifactsList(args as any);
        case 'artifact_get':
          return await handleArtifactGet(args as any);
        case 'coverage_get':
          return await handleCoverageGet(args as any);
        case 'report_generate':
          return await handleReportGenerate(args as any);

        // AI Failure Analysis, Fixes & Verification
        case 'failure_analyze':
        case 'nova_analyze_failures':
          return await handleFailureAnalyze(args as any);
        case 'failure_get':
          return await handleFailureGet(args as any);
        case 'fix_generate':
          return await handleFixGenerate(args as any);
        case 'fix_apply':
        case 'nova_approve_fix':
          return await handleFixApply(args as any);
        case 'fix_verify':
        case 'nova_verify_fix':
          return await handleFixVerify(args as any);

        // Environment & System Health
        case 'environment_list':
          return await handleEnvironmentList(args as any);
        case 'environment_create':
          return await handleEnvironmentCreate(args as any);
        case 'health_check':
          return await handleHealthCheck();

        // Autonomous Project Testing Pipeline
        case 'project_auto_test':
        case 'test_project_autonomous':
          return await handleProjectAutoTest(args as any);

        // Mobile Testing & Device Farm
        case 'mobile_device_list':
          return await handleMobileDeviceList(args as any);
        case 'mobile_scenario_generate':
          return await handleMobileScenarioGenerate(args as any);
        case 'mobile_crash_inspect':
          return await handleMobileCrashInspect(args as any);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err: any) {
      log.error({ err: err.message, tool: name }, 'Tool execution error');
      return {
        content: [{ type: 'text', text: `Error executing ${name}: ${err.message}` }],
        isError: true
      };
    }
  });

  // 3. Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const projects = await prisma.project.findMany({ take: 10 });
    return {
      resources: projects.map((p) => ({
        uri: `nova://projects/${p.id}/summary`,
        name: `${p.name} Health & Test Summary`,
        mimeType: 'application/json'
      }))
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri.startsWith('nova://projects/')) {
      const parts = uri.replace('nova://projects/', '').split('/');
      const projectId = parts[0];
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { testRuns: { take: 5, orderBy: { createdAt: 'desc' } }, findings: { take: 5 } }
      });

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(sanitizeMcpOutput(project), null, 2)
          }
        ]
      };
    }
    throw new Error(`Resource ${uri} not found`);
  });

  // 4. Prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'auto-test-project',
          description: 'Trigger autonomous 10-step end-to-end testing workflow for the current project.',
          arguments: [
            { name: 'projectId', description: 'ID of target project (optional)', required: false },
            { name: 'targetUrl', description: 'Target URL to discover and test (optional)', required: false }
          ]
        },
        {
          name: 'review-test-failures',
          description: 'Review recent failed tests and formulate actionable remediation patches.',
          arguments: [{ name: 'runId', description: 'Test Run ID to review', required: true }]
        }
      ]
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === 'auto-test-project') {
      const targetUrl = request.params.arguments?.targetUrl || 'current workspace';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Execute the autonomous 10-step NovaQA testing pipeline for: ${targetUrl}. Discover the application, generate test scenarios, run sandbox tests, triage failures, and provide proposed fixes.`
            }
          }
        ]
      };
    }

    if (request.params.name === 'review-test-failures') {
      const runId = request.params.arguments?.runId || '';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze test failures for Test Run '${runId}'. Classify each failure into REAL_BUG vs SELECTOR_DRIFT vs TIMING_ISSUE, extract root causes, and propose code patches.`
            }
          }
        ]
      };
    }

    throw new Error(`Prompt ${request.params.name} not found`);
  });

  return server;
}
