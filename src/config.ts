/**
 * SPDX-FileCopyrightText: © 2025 Talib Kareem <taazkareem@icloud.com>
 * SPDX-License-Identifier: MIT
 *
 * Configuration handling for ClickUp API credentials and application settings
 *
 * The required environment variables (CLICKUP_API_KEY and CLICKUP_TEAM_ID) are passed 
 * securely to this file when running the hosted server at smithery.ai. Optionally, 
 * they can be parsed via command line arguments when running the server locally.
 * 
 * The document support is optional and can be passed via command line arguments.
 * The default value is 'false' (string), which means document support will be disabled if
 * no parameter is passed. Pass it as 'true' (string) to enable it.
 */

// Initialization and retrieval functions for configuration
/**
 * Initialize and retrieve configuration values for ClickUp MCP Server.
 * Supports Node.js (process.env and CLI args) and Cloudflare Workers (env map).
 */
// Log levels enum
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}
// Parse LOG_LEVEL string to LogLevel enum
export const parseLogLevel = (levelStr: string | undefined): LogLevel => {
  if (!levelStr) return LogLevel.ERROR;
  switch (levelStr.toUpperCase()) {
    case 'TRACE': return LogLevel.TRACE;
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    default: return LogLevel.ERROR;
  }
};
// Configuration interface
export interface Config {
  clickupApiKey: string;
  clickupTeamId: string;
  enableSponsorMessage: boolean;
  documentSupport: string;
  logLevel: LogLevel;
  disabledTools: string[];
}
let configuration: Config | null = null;
// Initialization options
interface InitOptions {
  args?: string[];
  env?: Record<string, string | undefined>;
}
/**
 * Initialize configuration. Call once before getConfig().
 * @param options Optional overrides for args (CLI) and env map.
 */
export function initConfig(options: InitOptions = {}): void {
  if (configuration) return;
  const args = options.args ?? (typeof process !== 'undefined' && process.argv ? process.argv.slice(2) : []);
  const envVars = options.env ?? (typeof process !== 'undefined' && process.env ? process.env : {} as Record<string, string>);
  // Parse --env KEY=VALUE arguments
  const cliEnv: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) {
      const [key, val] = args[i + 1].split('=');
      if (key && val !== undefined) cliEnv[key] = val;
      i++;
    }
  }
  // Build configuration
  const cfg: Config = {
    clickupApiKey: cliEnv['CLICKUP_API_KEY'] || envVars['CLICKUP_API_KEY'] || '',
    clickupTeamId: cliEnv['CLICKUP_TEAM_ID'] || envVars['CLICKUP_TEAM_ID'] || '',
    enableSponsorMessage: (envVars['ENABLE_SPONSOR_MESSAGE'] ?? '') !== 'false',
    documentSupport: cliEnv['DOCUMENT_SUPPORT'] || envVars['DOCUMENT_SUPPORT'] || envVars['DOCUMENT_MODULE'] || envVars['DOCUMENT_MODEL'] || 'false',
    logLevel: parseLogLevel(cliEnv['LOG_LEVEL'] || envVars['LOG_LEVEL']),
    disabledTools: (cliEnv['DISABLED_TOOLS'] || envVars['DISABLED_TOOLS'] || envVars['DISABLED_COMMANDS'] || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s),
  };
  // Warn if required vars are missing
  const missing = ['clickupApiKey', 'clickupTeamId'].filter(k => !cfg[k as keyof Config]);
  if (missing.length > 0) {
    console.warn(`Missing required environment variables (will proceed, but may fail): ${missing.join(', ')}`);
  }
  configuration = cfg;
}
/**
 * Retrieve the initialized configuration
 */
export function getConfig(): Config {
  if (!configuration) {
    throw new Error('Configuration not initialized. Call initConfig() first.');
  }
  return configuration;
}
