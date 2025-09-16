/**
 * SCRO (Source-Controlled Remote Orchestration) - System Handlers Index
 * Exports all SCRO system-level handlers for enhanced infrastructure as code
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const RemoteShellHandler = require('./remote-shell-handler');
const ContainerHandler = require('./container-handler');
const SCROOrchestrator = require('./scro-orchestrator');

module.exports = {
  RemoteShellHandler,
  ContainerHandler,
  SCROOrchestrator,
  
  // Factory functions for easy integration
  createRemoteShellHandler: (config = {}) => {
    const handler = new RemoteShellHandler();
    return handler.initialize(config).then(() => handler);
  },
  
  createContainerHandler: (config = {}) => {
    const handler = new ContainerHandler();
    return handler.initialize(config).then(() => handler);
  },
  
  createSCROOrchestrator: (config = {}) => {
    const handler = new SCROOrchestrator();
    return handler.initialize(config).then(() => handler);
  },
  
  // Register all system handlers with interpreter
  registerSystemHandlers: async (interpreter, config = {}) => {
    const handlers = {};
    
    // Remote shell handler
    if (config.enableRemoteShell !== false) {
      handlers.remote_shell = await module.exports.createRemoteShellHandler(config.remoteShell);
    }
    
    // Container handler  
    if (config.enableContainer !== false) {
      handlers.container = await module.exports.createContainerHandler(config.container);
    }
    
    // Deployment orchestrator
    if (config.enableDeployment !== false) {
      handlers.deployment = await module.exports.createDeploymentHandler(config.deployment);
    }
    
    // Register with interpreter
    for (const [name, handler] of Object.entries(handlers)) {
      interpreter.registerAddressHandler(name, handler);
    }
    
    return handlers;
  }
};