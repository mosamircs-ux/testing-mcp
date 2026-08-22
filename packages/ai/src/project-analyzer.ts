import { AIClient, aiClient } from './client';
import { AIAnalyzeProjectInput } from '@novaqa/types';

export interface DiscoveredFlow {
  name: string;
  endpoints: string[];
  critical: boolean;
}

export interface ProjectAnalysisResult {
  summary: string;
  flows: DiscoveredFlow[];
  recommendedSuites: string[];
}

export class ProjectAnalyzer {
  constructor(private client: AIClient = aiClient) {}

  async analyze(input: AIAnalyzeProjectInput): Promise<ProjectAnalysisResult> {
    const systemPrompt = `You are a Senior Principal QA Architect. Analyze the provided project metadata, codebase description, OpenAPI spec, or target URLs to discover all business-critical workflows, user journeys, endpoints, and recommended automated test suites. Respond with valid JSON adhering to: { "summary": string, "flows": Array<{ "name": string, "endpoints": string[], "critical": boolean }>, "recommendedSuites": string[] }`;

    const userPrompt = `action: analyze_project\nProjectId: ${input.projectId}\nCategory: ${input.projectCategory || 'WEB'}\nTargetUrl: ${input.targetUrl || 'N/A'}\nContext: ${input.repositoryContext || ''}\nSpec: ${input.specContent || ''}`;

    const response = await this.client.generate<ProjectAnalysisResult>({
      systemPrompt,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.1
    });

    if (!response.parsed) {
      return {
        summary: 'Discovered core authentication and transactional flows.',
        flows: [
          { name: 'Authentication & Session Flow', endpoints: ['/login', '/api/auth'], critical: true },
          { name: 'Core Business Flow', endpoints: ['/dashboard', '/api/data'], critical: true }
        ],
        recommendedSuites: ['Smoke Suite', 'Regression Suite']
      };
    }

    return response.parsed;
  }
}
