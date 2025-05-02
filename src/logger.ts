/**
 * SPDX-FileCopyrightText: © 2025 Talib Kareem <taazkareem@icloud.com>
 * SPDX-License-Identifier: MIT
 *
 * Logger module for MCP Server
 * 
 * This module provides logging functionality for the server,
 * writing logs to only the log file to avoid interfering with JSON-RPC.
 */

import { getConfig, LogLevel } from './config.js';

// Detect Node.js environment
const isNode = typeof process !== 'undefined' && typeof process.versions?.node === 'string';
// Process ID for logging (only in Node)
const pid = isNode ? process.pid : 0;
// File logging stream (Node only)
let logStream: any = null;
(async () => {
  if (isNode) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const url = await import('url');
      // Resolve directory name
      const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
      const logFileName = 'server.log';
      logStream = fs.createWriteStream(path.join(__dirname, logFileName), { flags: 'w' });
      logStream.write(`Logging initialized to ${path.join(__dirname, logFileName)}\n`);
    } catch {
      // Ignore if dynamic import fails
    }
  }
})();


// Re-export LogLevel enum
export { LogLevel };

/**
 * Check if a log level is enabled based on the configured level
 * @param level The log level to check
 * @returns True if the level should be logged
 */
export function isLevelEnabled(level: LogLevel): boolean {
  // Compare against current config log level
  return level >= getConfig().logLevel;
}

/**
 * Log function that writes only to file to avoid interfering with JSON-RPC
 * @param level Log level (trace, debug, info, warn, error)
 * @param message Message to log
 * @param data Optional data to include in log
 */
export function log(level: 'trace' | 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
  const levelEnum = level === 'trace' ? LogLevel.TRACE 
    : level === 'debug' ? LogLevel.DEBUG
    : level === 'info' ? LogLevel.INFO
    : level === 'warn' ? LogLevel.WARN 
    : LogLevel.ERROR;
  
  // Skip if level is below configured level
  if (!isLevelEnabled(levelEnum)) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  
  // Format the log message differently based on the level and data
  let logMessage = `[${timestamp}] [PID:${pid}] ${level.toUpperCase()}: ${message}`;
  
  // Format data differently based on content and log level
  if (data) {
    // For debugging and trace levels, try to make the data more readable
    if (level === 'debug' || level === 'trace') {
      // If data is a simple object with few properties, format it inline
      if (typeof data === 'object' && data !== null && !Array.isArray(data) && 
          Object.keys(data).length <= 4 && Object.keys(data).every(k => 
            typeof data[k] !== 'object' || data[k] === null)) {
        const dataStr = Object.entries(data)
          .map(([k, v]) => `${k}=${v === undefined ? 'undefined' : 
            (v === null ? 'null' : 
              (typeof v === 'string' ? `"${v}"` : v))}`)
          .join(' ');
        
        logMessage += ` (${dataStr})`;
      } else {
        // For more complex data, keep the JSON format but on new lines
        logMessage += '\n' + JSON.stringify(data, null, 2);
      }
    } else {
      // For other levels, keep the original JSON format
      logMessage += '\n' + JSON.stringify(data, null, 2);
    }
  }

  // Write to file in Node, or console otherwise
  if (isNode && logStream) {
    logStream.write(logMessage + '\n');
  } else {
    console.log(logMessage);
  }
}

/**
 * Shorthand for trace level logs
 * @param message Message to log
 * @param data Optional data to include in log
 */
export function trace(message: string, data?: any) {
  log('trace', message, data);
}

/**
 * Shorthand for debug level logs
 * @param message Message to log
 * @param data Optional data to include in log
 */
export function debug(message: string, data?: any) {
  log('debug', message, data);
}

/**
 * Shorthand for info level logs
 * @param message Message to log
 * @param data Optional data to include in log
 */
export function info(message: string, data?: any) {
  log('info', message, data);
}

/**
 * Shorthand for warn level logs
 * @param message Message to log
 * @param data Optional data to include in log
 */
export function warn(message: string, data?: any) {
  log('warn', message, data);
}

/**
 * Shorthand for error level logs
 * @param message Message to log
 * @param data Optional data to include in log
 */
export function error(message: string, data?: any) {
  log('error', message, data);
}

/**
 * Logger class for creating context-specific loggers
 */
export class Logger {
  private context: string;

  /**
   * Create a new logger with context
   * @param context The context to prepend to log messages
   */
  constructor(context: string) {
    this.context = context;
  }

  /**
   * Check if a log level is enabled for this logger
   * @param level The level to check
   * @returns True if logging at this level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return isLevelEnabled(level);
  }

  /**
   * Log at trace level
   * @param message Message to log
   * @param data Optional data to include in log
   */
  trace(message: string, data?: any) {
    log('trace', `[${this.context}] ${message}`, data);
  }

  /**
   * Log at debug level
   * @param message Message to log
   * @param data Optional data to include in log
   */
  debug(message: string, data?: any) {
    log('debug', `[${this.context}] ${message}`, data);
  }

  /**
   * Log at info level
   * @param message Message to log
   * @param data Optional data to include in log
   */
  info(message: string, data?: any) {
    log('info', `[${this.context}] ${message}`, data);
  }

  /**
   * Log at warn level
   * @param message Message to log
   * @param data Optional data to include in log
   */
  warn(message: string, data?: any) {
    log('warn', `[${this.context}] ${message}`, data);
  }

  /**
   * Log at error level
   * @param message Message to log
   * @param data Optional data to include in log
   */
  error(message: string, data?: any) {
    log('error', `[${this.context}] ${message}`, data);
  }
}

// Handle SIGTERM for clean shutdown in Node.js only
if (isNode) {
  process.on('SIGTERM', () => {
    log('info', 'Received SIGTERM signal, shutting down...');
    if (logStream) {
      logStream.end(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}