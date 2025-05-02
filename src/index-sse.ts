/**
 * SPDX-FileCopyrightText: © 2025 Talib Kareem <taazkareem@icloud.com>
 * SPDX-License-Identifier: MIT
 *
 * ClickUp MCP Server (SSE transport via Hono)
 *
 * Deploy this as a Cloudflare Worker or any Hono-supported Fetch runtime.
 */
import { initConfig } from './config.js';
// server.js will be imported dynamically after configuration
// Track whether initialization has run


import { McpAgent } from "agents/mcp";
import { McpServerInstance } from './server.js';

// Define our MCP agent with tools
export class ClickUPMcp extends McpAgent {
  server = null
  async init() {
    // @ts-ignore
    initConfig({
      env: {
        CLICKUP_API_KEY: process.env.CLICKUP_API_KEY,
        CLICKUP_LIST_ID: process.env.CLICKUP_LIST_ID,
        CLICKUP_TEAM_ID: process.env.CLICKUP_TEAM_ID,

      }
    });
    const server = await import('./server.js')
    server.configureServer()
    this.server = server.McpServerInstance
  }

}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    console.log('initializing')
    // Initialize configuration from Worker env

    console.log('initializing')
    // Dynamically import server module


    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return ClickUPMcp.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return ClickUPMcp.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
