# 🛰️ NovaQA MCP Setup & Client Integration Guide

This guide describes how to connect **NovaQA** to your favorite AI coding assistant or IDE using the **Model Context Protocol (MCP)**.

---

## Supported Clients & Configurations

### 1. 🚀 Google Antigravity
Add to your IDE settings or MCP configuration:
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

### 2. 🟣 Claude Code / Claude Desktop
Add to `claude_desktop_config.json`:
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

### 3. ⚡ Cursor IDE
Add to `.cursor/mcp.json`:
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

### 4. 🌊 Windsurf / Codeium
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

### 5. 🟦 VS Code (Continue / Cline / Roo Code)
Add to VS Code `settings.json`:
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

## 🎯 Example Prompts

When connected via MCP, you can prompt your AI assistant with:

1. **"Test this project"**:
   - Triggers `project_auto_test` to discover routes/APIs, build requirements, generate test plans across 19 categories, execute Playwright/API tests, triage failures, and propose git diff patches.
2. **"Generate test scenarios for user checkout"**:
   - Calls `test_plan_generate` with feature specification.
3. **"Run the smoke test suite and show failures"**:
   - Calls `test_run_suite` followed by `failure_analyze`.
4. **"Verify the fix for finding #123"**:
   - Calls `fix_verify` with `scope: "FULL_REGRESSION"`.
