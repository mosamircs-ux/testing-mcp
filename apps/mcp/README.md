# 🛰️ NovaQA Official Model Context Protocol (MCP) Server

Production-grade **Model Context Protocol (MCP)** server for **NovaQA**. Enables any AI coding assistant or autonomous agent (**Antigravity**, **Claude Code**, **Cursor**, **VS Code**, **Codex**, **Windsurf**) to discover applications, author resilient tests, execute test runs on real sandbox browsers/APIs, triage failures into 10 root-cause categories, generate unified git diff patches, and run 4-stage verification lifecycles.

---

## ⚡ Quick Start

### 1. Build and Run Server Locally
```bash
# Build monorepo packages
npm run build

# Start MCP server over stdio
npm run dev:mcp
```

### 2. Client Configurations

#### 🚀 Google Antigravity
Add to your Antigravity IDE configuration or MCP settings:
```json
{
  "mcpServers": {
    "novaqa": {
      "command": "node",
      "args": ["C:/Users/mohamedsamir/Documents/testing-mcp/apps/mcp/dist/index.js"],
      "env": {
        "NOVAQA_API_KEY": "nova_live_your_api_key_here",
        "DATABASE_URL": "file:C:/Users/mohamedsamir/Documents/testing-mcp/dev.db"
      }
    }
  }
}
```

#### 🟣 Claude Code / Claude Desktop
Add to `~/.claude/claude_desktop_config.json` (Mac/Linux) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):
```json
{
  "mcpServers": {
    "novaqa": {
      "command": "node",
      "args": ["C:/Users/mohamedsamir/Documents/testing-mcp/apps/mcp/dist/index.js"],
      "env": {
        "NOVAQA_API_KEY": "nova_live_your_api_key_here"
      }
    }
  }
}
```

#### ⚡ Cursor IDE
Add to `.cursor/mcp.json` in your workspace root:
```json
{
  "mcpServers": {
    "novaqa": {
      "command": "node",
      "args": ["C:/Users/mohamedsamir/Documents/testing-mcp/apps/mcp/dist/index.js"],
      "env": {
        "NOVAQA_API_KEY": "nova_live_your_api_key_here"
      }
    }
  }
}
```

#### 🌊 Windsurf / Codeium
Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "novaqa": {
      "command": "node",
      "args": ["C:/Users/mohamedsamir/Documents/testing-mcp/apps/mcp/dist/index.js"],
      "env": {
        "NOVAQA_API_KEY": "nova_live_your_api_key_here"
      }
    }
  }
}
```

#### 🟦 VS Code (Continue / Cline / Roo Code)
Add to your VS Code MCP Extension settings (`settings.json`):
```json
{
  "mcp.servers": {
    "novaqa": {
      "command": "node",
      "args": ["C:/Users/mohamedsamir/Documents/testing-mcp/apps/mcp/dist/index.js"],
      "env": {
        "NOVAQA_API_KEY": "nova_live_your_api_key_here"
      }
    }
  }
}
```

---

## 🛠️ Complete 31 MCP Tools Reference

### 1. Project Management & Autonomous Discovery
- `project_create`: Create a project with engineType, target URL, and default test suite.
- `project_list`: List all projects, environments, and test suites in organization.
- `project_get`: Retrieve project configuration, suites, and recent test findings.
- `project_discover`: Crawl application routes, OpenAPI schemas, and critical user journeys.
- `application_map_get`: Retrieve UI route hierarchy and page topology.
- `api_map_get`: Retrieve API endpoints, HTTP methods, and schema contracts.
- `requirements_get`: Retrieve normalized business requirements matrix.

### 2. Test Planning & Authoring
- `test_plan_generate`: Generate comprehensive 19-category test matrix with coverage metrics.
- `test_list`: List test cases with status, flakiness score, and step summaries.
- `test_get`: Retrieve test case definition with executable step sequence.
- `test_create`: Create an executable test case with structured steps (`NAVIGATE`, `CLICK`, `TYPE`, `ASSERT`).
- `test_update`: Update test case metadata, steps, or priority.
- `test_delete`: Delete a test case from a suite.

### 3. Test Execution & Control
- `test_run`: Execute full test run on real sandbox environments (Playwright, API, Mobile).
- `test_run_suite`: Execute a specific test suite.
- `test_run_single`: Execute an isolated single test case in sandbox.
- `test_cancel`: Cancel in-flight execution run.
- `test_retry`: Retry failed or flaky tests from a previous run.
- `regression_run`: Execute full multi-suite regression matrix.

### 4. Results, Artifacts & Coverage
- `test_result_get`: Retrieve test case execution result, duration, step logs, and stack trace.
- `test_result_list`: List all test results for a test run.
- `artifacts_list`: List captured artifacts (screenshots, traces, logs, HAR).
- `artifact_get`: Retrieve metadata and storage URL for a specific artifact.
- `coverage_get`: Retrieve requirement, route, and API test coverage percentages.
- `report_generate`: Generate executive summary Markdown / JSON report.

### 5. AI Failure Triage, Fixes & Verification
- `failure_analyze`: Deep multi-signal failure root cause analysis across 10 categories (`REAL_BUG`, `TEST_FLAKINESS`, `SELECTOR_DRIFT`, `TIMING_ISSUE`, `NETWORK_ISSUE`, `ENVIRONMENT_ISSUE`, `DATA_ISSUE`, `AUTHENTICATION_ISSUE`, `PERMISSION_ISSUE`, `UNKNOWN`).
- `failure_get`: Retrieve finding root cause, confidence, regression risk, and proposed patch.
- `fix_generate`: Generate proposed unified git diff patch for an identified defect.
- `fix_apply`: Explicitly approve and apply a proposed code fix patch or self-heal update.
- `fix_verify`: Execute the 4-stage verification lifecycle (rerun failed ➔ related ➔ regression) before resolving a finding.

### 6. Environment & System Health
- `environment_list`: List target environments for a project.
- `environment_create`: Create target environment (Staging, QA, Prod).
- `health_check`: MCP server and database connectivity health status.

### 7. Autonomous Project Context Understanding ("Test this project")
- `project_auto_test`: The complete 10-step autonomous workflow:
  1. **Identify Project**
  2. **Inspect Configuration**
  3. **Discover Application**
  4. **Build Internal Specification**
  5. **Generate Test Plan**
  6. **Generate Executable Tests**
  7. **Execute Tests in Sandbox**
  8. **Analyze Failures (10 categories)**
  9. **Produce Summary Report**
  10. **Provide Fix Proposals & Self-Healing**

---

## 🔒 Security & Tenant Isolation

1. **Authentication**: Every operation verifies API keys against the database.
2. **Tenant Scoping**: All queries and mutations are isolated by `organizationId`.
3. **Secret Redaction**: Passwords, API keys, tokens, authorization headers, and private keys are stripped automatically via `sanitizeMcpOutput`.
