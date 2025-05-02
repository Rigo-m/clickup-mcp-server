/**
 * SPDX-FileCopyrightText: © 2025 Talib Kareem <taazkareem@icloud.com>
 * SPDX-License-Identifier: MIT
 *
 * Shared Services Module
 * 
 * This module maintains singleton instances of services that should be shared
 * across the application to ensure consistent state.
 */

import { createClickUpServices, ClickUpServices } from './clickup/index.js';
import { getConfig } from '../config.js';
import { Logger } from '../logger.js';

// Logger for service initialization events
const logger = new Logger('SharedServices');

/**
 * Proxy for lazy initialization of ClickUp services
 */
const _servicesProxyTarget: any = {};
export const clickUpServices = new Proxy(_servicesProxyTarget, {
  get(target, prop: keyof ClickUpServices, receiver) {
    if (!target._instance) {
      try {
        const cfg = getConfig();
        logger.info('Creating shared ClickUp services singleton', { teamId: cfg.clickupTeamId });
        target._instance = createClickUpServices({
          apiKey: cfg.clickupApiKey,
          teamId: cfg.clickupTeamId
        });
        logger.info('Services initialization complete', {
          services: Object.keys(target._instance).join(', '),
          teamId: cfg.clickupTeamId
        });
      } catch (err) {
        // Configuration not initialized yet; defer initialization
        throw err;
      }
    }
    const instance: ClickUpServices = target._instance;
    return (instance as any)[prop];
  }
}) as ClickUpServices;

// Export individual services for convenience
export const {
  list: listService,
  task: taskService,
  folder: folderService,
  workspace: workspaceService,
  timeTracking: timeTrackingService,
  document: documentService
} = clickUpServices;
