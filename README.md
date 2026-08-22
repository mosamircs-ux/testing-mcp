# NovaQA — Autonomous AI Software Testing Platform

> **A production-grade, multi-engine autonomous software testing platform with Model Context Protocol (MCP) support for Cursor, Antigravity IDE, Claude, and Codex.**

---

## 🏛️ Platform Architecture

```
                        ┌────────────────────────┐
                        │   Web Testing Console  │
                        │ Next.js 14 / Dashboard │
                        └───────────┬────────────┘
                                    │
                                    ▼
┌──────────────┐          ┌────────────────────────┐
│ MCP Clients  │◄────────►│      NovaQA API        │
│ Cursor       │   MCP    │                        │
│ Antigravity  │◄────────►│ AI Test Orchestrator   │
│ Claude       │          │ Project & Suite Engine │
│ Codex        │          │ Telemetry & Reports    │
└──────────────┘          └─────────┬──────────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
       Browser Agent          API Test Agent        Mobile Agent
       Playwright             REST / GraphQL        Android / iOS
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    ▼
                          ┌────────────────────────┐
                          │ Test Execution Sandbox │
                          │ Screenshots & Video    │
                          │ Logs & DOM Snapshots   │
                          │ Network HAR & Traces   │
                          └─────────┬──────────────┘
                                    ▼
                          AI Failure Diagnostics
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                    Bug Detected          Test Flaky
                         │                     │
                         ▼                     ▼
                    Code Diff Patch       Auto-Healing
```

---

## 📂 Monorepo Structure

```
novaqa/
├── docker-compose.yml             # PostgreSQL 16, Redis 7, MinIO S3 storage
├── .env.example                   # Environment configuration template
├── package.json                   # Root workspace orchestrator
├── tsconfig.base.json             # Root TypeScript configuration
│
├── apps/
│   ├── web/                       # Next.js 14/15 App Router (Landing, Dashboard, Live Execution, MCP Hub)
│   ├── api/                       # Fastify/Express Core REST & SSE API (Auth, Projects, Runs, Findings)
│   ├── mcp/                       # Official Model Context Protocol (MCP) Server (Tools, Resources, Prompts)
│   ├── worker/                    # Background Queue & Scheduler Engine (BullMQ/Redis job processor)
│   └── test-runner/               # Multi-Agent Test Execution Sandbox (Playwright, API, Mobile)
│
└── packages/
    ├── database/                  # Prisma Schema, Migrations, Client, Seed Scripts
    ├── types/                     # Shared TypeScript Schemas, DTOs, Enums, MCP Contracts
    ├── ai/                        # LLM Orchestrator, Test Generation, Failure Analyzer, Auto-Healer
    ├── testing/                   # Test Lifecycle, Assertions, Sandbox Contract
    ├── browser/                   # Playwright Runner, DOM Serializer, HAR Recorder, Visual Regression
    ├── api-testing/               # HTTP/REST & GraphQL Contract Runner, OpenAPI Parser
    ├── mobile-testing/            # Mobile Agent Harness & Driver Interface
    ├── reporting/                 # Report Generators (HTML, JUnit XML, Markdown, Trend Metrics)
    ├── auth/                      # RBAC, JWT/Session tokens, API Key hashing & verification
    └── shared/                    # Structured Logger (Pino), S3/MinIO Storage, Env Config, AppError
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher (Tested on `v22.23.2`)
- **npm**: `v10.0.0` or higher
- **Docker** & **Docker Compose** (for PostgreSQL & Redis)

### 2. Clone & Install Dependencies
```bash
git clone <repo-url>
cd testing-mcp
npm install
```

### 3. Start Database & Infrastructure
Launch PostgreSQL, Redis, and MinIO locally:
```bash
npm run docker:up
```

### 4. Database Setup & Seed
Generate Prisma Client, push the schema to PostgreSQL, and seed demo projects:
```bash
npm run db:push
npm run db:seed
```

> **Default Seed Accounts & Keys:**
> - **Admin User**: `admin@novaqa.dev` (Password: `NovaQA2026!`)
> - **Demo MCP API Key**: `nqa_live_9f83a8b417e92384a7e9182374b8912c`

### 5. Start Development Services
Run all services simultaneously or individually:

```bash
# Run API Server (Port 4000)
npm run dev:api

# Run Next.js Web Console (Port 3000)
npm run dev:web

# Run MCP Server (Stdio)
npm run dev:mcp

# Run Background Queue Worker
npm run dev:worker
```

---

## 🛰️ Model Context Protocol (MCP) Setup

Connect NovaQA directly to AI coding assistants:

### Cursor IDE Configuration
Add to `~/.cursor/mcp.json` or project `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "novaqa": {
      "command": "node",
      "args": ["<WORKSPACE_PATH>/apps/mcp/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/novaqa?schema=public",
        "AI_DEFAULT_PROVIDER": "mock"
      }
    }
  }
}
```

### Google Antigravity Configuration
Add to `~/.gemini/antigravity-ide/mcp/novaqa/mcp_config.json`:
```json
{
  "command": "node",
  "args": ["<WORKSPACE_PATH>/apps/mcp/dist/index.js"],
  "env": {
    "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/novaqa?schema=public"
  }
}
```

### Claude Desktop Configuration
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "novaqa": {
      "command": "node",
      "args": ["<WORKSPACE_PATH>/apps/mcp/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/novaqa?schema=public"
      }
    }
  }
}
```

---

## 🛠️ Exposed MCP Tools

| MCP Tool | Description |
| :--- | :--- |
| `nova_list_projects` | Lists all projects, test suites, and target environments. |
| `nova_analyze_project` | Autonomous flow discovery from codebase, target URL, or OpenAPI specification. |
| `nova_generate_test_plan` | Generates structured test scenarios from PRDs or feature requests. |
| `nova_generate_test_code` | Generates executable Playwright TypeScript test cases. |
| `nova_execute_test_run` | Executes automated tests across sandboxes and returns complete summary. |
| `nova_get_test_run_status` | Polls real-time step status, terminal logs, and failure artifacts. |
| `nova_analyze_failures` | AI Root Cause Analysis of test failures with Bug vs Flake classification. |
| `nova_auto_heal_test` | Self-healing AI selector engine to recover broken DOM locators. |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API Health & uptime check |
| `GET` | `/health/ready` | Database & dependency readiness probe |
| `POST` | `/api/v1/auth/login` | Authenticate user & get JWT token |
| `GET` | `/api/v1/projects` | List all projects & environments |
| `POST` | `/api/v1/projects` | Create a new project |
| `POST` | `/api/v1/runs` | Enqueue automated test run |
| `GET` | `/api/v1/runs/:id` | Get test run details & results |
| `GET` | `/api/v1/runs/:id/stream` | **Live Server-Sent Events (SSE)** log & step stream |
| `GET` | `/api/v1/runs/:id/report/junit.xml` | Export JUnit XML report for CI/CD |
| `GET` | `/api/v1/runs/:id/report/summary.md` | Export Markdown test run summary |
| `GET` | `/api/v1/findings` | List AI findings & failure classifications |
| `POST` | `/api/v1/findings/:id/auto-heal` | Trigger self-healing on broken selector |
| `POST` | `/api/v1/ai/analyze-project` | AI project flow & specification analyzer |
| `POST` | `/api/v1/ai/generate-tests` | AI autonomous test case generator |
| `POST` | `/api/v1/ai/triage-failure` | AI failure triaging & code patch generator |

---

## 🧪 Verification & Quality Commands

```bash
# Run unit & integration test suites
npm test

# Run strict TypeScript type checking across all apps & packages
npm run typecheck

# Run linter
npm run lint
```

---

## 🔒 Security & RBAC

NovaQA includes a role-based access control matrix (`OWNER`, `ADMIN`, `ENGINEER`, `VIEWER`) and cryptographically hashed API keys (HMAC-SHA256 with system salt), ensuring secure multi-tenant execution across teams and automated CI/CD pipelines.

---

## 📄 License
Apache 2.0. Built for modern high-velocity software engineering teams.
