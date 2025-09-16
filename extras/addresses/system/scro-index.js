/**
 * SCRO (Source-Controlled Remote Orchestration) - System Handlers Index
 * Exports all SCRO system-level handlers for enhanced infrastructure as code
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const RemoteShellHandler = require('./remote-shell-handler');
const PodmanHandler = require('./podman-handler');
const DockerHandler = require('./docker-handler');
const SCROOrchestrator = require('./scro-orchestrator');

module.exports = {
  RemoteShellHandler,
  PodmanHandler,
  DockerHandler,
  SCROOrchestrator,
  
  // Factory functions for easy integration
  createRemoteShellHandler: (config = {}) => {
    const handler = new RemoteShellHandler();
    return handler.initialize(config).then(() => handler);
  },
  
  createPodmanHandler: (config = {}) => {
    const handler = new PodmanHandler();
    return handler.initialize(config).then(() => handler);
  },
  
  createDockerHandler: (config = {}) => {
    const handler = new DockerHandler();
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
    
    // Container handlers (user can choose podman, docker, or both)
    if (config.enablePodman !== false) {
      handlers.podman = await module.exports.createPodmanHandler(config.podman);
    }
    
    if (config.enableDocker !== false) {
      handlers.docker = await module.exports.createDockerHandler(config.docker);
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