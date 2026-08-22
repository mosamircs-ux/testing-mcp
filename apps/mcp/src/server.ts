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
  handleListProjects,
  handleAnalyzeProject,
  handleGenerateTestPlan,
  handleGenerateTestCode,
  handleExecuteTestRun,
  handleGetTestRunStatus,
  handleAnalyzeFailures,
  handleAutoHealTest
} from './tools.js';
import { prisma } from '@novaqa/database';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('mcp-server');

export function createMcpServer() {
  const server = new Server(
    {
      name: 'NovaQA Test Orchestrator MCP',
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

  // 1. Tool Listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'nova_list_projects',
          description: 'List all projects, test suites, and target environments in NovaQA platform.',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'nova_analyze_project',
          description: 'Autonomous AI analysis of project requirements, OpenAPI specs, and user flows.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string', description: 'ID of the project' },
              targetUrl: { type: 'string', description: 'Target URL to inspect' },
              repositoryContext: { type: 'string', description: 'Codebase or architecture summary' },
              specContent: { type: 'string', description: 'OpenAPI JSON or Swagger definition' }
            },
            required: ['projectId']
          }
        },
        {
          name: 'nova_generate_test_plan',
          description: 'Generate structured test scenarios and test cases from feature requirements.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              featureDescription: { type: 'string', description: 'Feature specification or user story' },
              targetUrl: { type: 'string' }
            },
            required: ['projectId', 'featureDescription']
          }
        },
        {
          name: 'nova_generate_test_code',
          description: 'Generate executable Playwright TypeScript code for a given test scenario.',
          inputSchema: {
            type: 'object',
            properties: {
              testCaseTitle: { type: 'string' },
              targetUrl: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } }
            },
            required: ['testCaseTitle', 'targetUrl', 'actions']
          }
        },
        {
          name: 'nova_execute_test_run',
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
          name: 'nova_get_test_run_status',
          description: 'Get real-time execution status, step logs, results, and artifacts for a test run.',
          inputSchema: {
            type: 'object',
            properties: {
              runId: { type: 'string' }
            },
            required: ['runId']
          }
        },
        {
          name: 'nova_analyze_failures',
          description: 'AI Root Cause Analysis of test failures with Bug vs Flaky classification, fix recommendations, and code patch.',
          inputSchema: {
            type: 'object',
            properties: {
              runId: { type: 'string' }
            },
            required: ['runId']
          }
        },
        {
          name: 'nova_auto_heal_test',
          description: 'Self-healing AI selector engine to recover broken element selectors from DOM snapshots.',
          inputSchema: {
            type: 'object',
            properties: {
              testCaseId: { type: 'string' },
              failedSelector: { type: 'string' },
              currentDomSnapshot: { type: 'string' }
            },
            required: ['testCaseId', 'failedSelector']
          }
        }
      ]
    };
  });

  // 2. Tool Execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    log.info({ tool: name }, 'MCP tool call received');

    try {
      switch (name) {
        case 'nova_list_projects':
          return await handleListProjects();
        case 'nova_analyze_project':
          return await handleAnalyzeProject(args as any);
        case 'nova_generate_test_plan':
          return await handleGenerateTestPlan(args as any);
        case 'nova_generate_test_code':
          return await handleGenerateTestCode(args as any);
        case 'nova_execute_test_run':
          return await handleExecuteTestRun(args as any);
        case 'nova_get_test_run_status':
          return await handleGetTestRunStatus(args as any);
        case 'nova_analyze_failures':
          return await handleAnalyzeFailures(args as any);
        case 'nova_auto_heal_test':
          return await handleAutoHealTest(args as any);
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
            text: JSON.stringify(project, null, 2)
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
          name: 'test-scenario-review',
          description: 'Review and refine test scenarios for maximum edge-case coverage.',
          arguments: [{ name: 'feature', description: 'Feature description to review', required: true }]
        }
      ]
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === 'test-scenario-review') {
      const feature = request.params.arguments?.feature || '';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review the test scenarios for feature: ${feature}. Ensure boundary values, auth failures, latency, and race condition tests are included.`
            }
          }
        ]
      };
    }
    throw new Error(`Prompt ${request.params.name} not found`);
  });

  return server;
}
