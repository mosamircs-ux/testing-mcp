import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';
import { logger } from '@novaqa/shared';

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('🛰️ NovaQA MCP Server running on stdio');
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error in MCP Server');
  process.exit(1);
});

export * from './server.js';
