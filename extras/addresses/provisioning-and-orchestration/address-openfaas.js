/*!
 * rexxjs/address-openfaas v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=OPENFAAS_ADDRESS_META
 */
/**
 * ADDRESS OPENFAAS Handler
 * Provides explicit ADDRESS OPENFAAS integration for serverless function operations
 *
 * Usage:
 *   REQUIRE "rexxjs/address-openfaas" AS OPENFAAS
 *   ADDRESS OPENFAAS
 *   "deploy name=hello-world image=hello:latest"
 *   "status"
 *   "list"
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Global handler instance
let openfaasHandlerInstance = null;

// OpenFaaS ADDRESS metadata function
function OPENFAAS_ADDRESS_META() {
  return {
    namespace: "rexxjs",
    type: 'address-target',
    name: 'ADDRESS OPENFAAS Serverless Service',
    version: '1.0.0',
    description: 'OpenFaaS serverless function operations via ADDRESS interface',
    provides: {
      addressTarget: 'openfaas',
      handlerFunction: 'ADDRESS_OPENFAAS_HANDLER',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true    // Also supports method-call style for convenience
    },
    dependencies: {
      "child_process": "builtin",
      "fs": "builtin",
      "path": "builtin"
    },
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      modules: ['child_process', 'fs', 'path']
    }
  };
}

class AddressOpenFaaSHandler {
  constructor() {
    this.runtime = 'openfaas';
    this.activeFunctions = new Map();
    this.functionCounter = 0;

    this.gatewayUrl = 'http://127.0.0.1:8080';
    this.backend = 'auto';
    this.detectedBackend = null;

    this.maxFunctions = 100;
    this.securityMode = 'permissive';
    this.allowedImages = new Set();
    this.trustedRegistries = new Set(['docker.io', 'ghcr.io', 'quay.io']);
    this.auditLog = [];

    this.spawn = spawn;
    this.fs = fs;
    this.path = path;

    this.processMonitoring = {
      enabled: false,
      interval: null,
      stats: new Map()
    };

    this.checkpointMonitoring = {
      enabled: true,
      activeFunctions: new Set()
    };
  }

  async initialize(config = {}) {
    if (config.gatewayUrl) this.gatewayUrl = config.gatewayUrl;
    if (config.backend) this.backend = config.backend;
    if (config.maxFunctions) this.maxFunctions = config.maxFunctions;
    if (config.securityMode) this.securityMode = config.securityMode;
    if (config.allowedImages) {
      config.allowedImages.forEach(img => this.allowedImages.add(img));
    }
    if (config.trustedRegistries) {
      this.trustedRegistries = new Set(config.trustedRegistries);
    }

    await this.detectBackend();

    this.log('initialized', {
      backend: this.detectedBackend,
      gateway: this.gatewayUrl,
      securityMode: this.securityMode
    });

    return { success: true, backend: this.detectedBackend };
  }

  async detectBackend() {
    if (this.backend !== 'auto') {
      this.detectedBackend = this.backend;
      return this.detectedBackend;
    }

    const k8sCheck = await this.execCommand('kubectl', ['version', '--client', '--short']);
    if (k8sCheck.exitCode === 0) {
      this.detectedBackend = 'kubernetes';
      return 'kubernetes';
    }

    const swarmCheck = await this.execCommand('docker', ['info']);
    if (swarmCheck.exitCode === 0 && swarmCheck.stdout.includes('Swarm: active')) {
      this.detectedBackend = 'swarm';
      return 'swarm';
    }

    this.detectedBackend = 'swarm';
    return 'swarm';
  }

  async handleAddressCommand(command, context = {}) {
    try {
      const parsed = this.parseCommand(command);

      if (!parsed.operation) {
        throw new Error('No operation specified');
      }

      switch (parsed.operation) {
        case 'status':
          return await this.getStatus();
        case 'list':
          return await this.listFunctions();
        case 'deploy':
          return await this.deployFunction(parsed.params, context);
        case 'invoke':
          return await this.invokeFunction(parsed.params, context);
        case 'remove':
          return await this.removeFunction(parsed.params, context);
        case 'scale':
          return await this.scaleFunction(parsed.params, context);
        case 'logs':
          return await this.getFunctionLogs(parsed.params, context);
        case 'describe':
          return await this.describeFunction(parsed.params, context);
        case 'new':
          return await this.newFunction(parsed.params, context);
        case 'build':
          return await this.buildFunction(parsed.params, context);
        case 'push':
          return await this.pushFunction(parsed.params, context);
        case 'deploy_rexx':
          return await this.deployRexxFunction(parsed.params, context);
        case 'invoke_rexx':
          return await this.invokeRexxFunction(parsed.params, context);
        case 'store_list':
          return await this.listStore(parsed.params, context);
        case 'store_deploy':
          return await this.deployFromStore(parsed.params, context);
        case 'secret_create':
          return await this.createSecret(parsed.params, context);
        case 'secret_list':
          return await this.listSecrets(parsed.params, context);
        case 'namespace_create':
          return await this.createNamespace(parsed.params, context);
        case 'namespace_list':
          return await this.listNamespaces(parsed.params, context);
        case 'cleanup':
          return await this.handleCleanup(parsed.params, context);
        case 'security_audit':
          return this.getSecurityAuditLog();
        case 'start_monitoring':
          this.startProcessMonitoring();
          return { success: true, enabled: true };
        case 'stop_monitoring':
          this.stopProcessMonitoring();
          return { success: true, enabled: false };
        case 'process_stats':
          return this.getProcessStatistics();
        case 'checkpoint_status':
          return this.getCheckpointStatus();
        case 'verify_backend':
          return await this.verifyBackend();
        case 'install':
          return await this.installOpenFaaS(parsed.params, context);
        default:
          throw new Error(`Unknown operation: ${parsed.operation}`);
      }
    } catch (error) {
      this.log('error', { error: error.message, command });
      return {
        success: false,
        error: error.message,
        operation: 'unknown'
      };
    }
  }

  parseCommand(command) {
    const trimmed = command.trim();

    // Handle quoted parameters properly
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        current += char;
        quoteChar = '';
      } else if (!inQuotes && char === ' ') {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    const operation = parts[0];

    const params = {};
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('=')) {
        const [key, ...valueParts] = part.split('=');
        let value = valueParts.join('=');

        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        params[key] = value;
      }
    }

    return { operation, params };
  }

  async getStatus() {
    const backend = await this.detectBackend();

    return {
      success: true,
      operation: 'status',
      runtime: this.runtime,
      backend: backend,
      gateway: this.gatewayUrl,
      functions: this.activeFunctions.size,
      maxFunctions: this.maxFunctions,
      securityMode: this.securityMode,
      monitoring: this.processMonitoring.enabled
    };
  }

  async listFunctions() {
    const result = await this.execFaasCommand(['list']);

    if (result.exitCode === 0) {
      const functions = this.parseFunctionList(result.stdout);

      functions.forEach(fn => {
        if (!this.activeFunctions.has(fn.name)) {
          this.activeFunctions.set(fn.name, {
            name: fn.name,
            image: fn.image,
            replicas: fn.replicas,
            invocations: fn.invocations
          });
        }
      });

      return {
        success: true,
        operation: 'list',
        functions: functions,
        count: functions.length
      };
    } else {
      throw new Error(`Failed to list functions: ${result.stderr}`);
    }
  }

  parseFunctionList(output) {
    const lines = output.trim().split('\n');
    const functions = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        functions.push({
          name: parts[0],
          invocations: parseInt(parts[1]) || 0,
          replicas: parseInt(parts[2]) || 0,
          image: parts[3]
        });
      }
    }

    return functions;
  }

  async deployFunction(params, context) {
    const { name, image, env, labels, constraints, secrets, namespace } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    if (!image) {
      throw new Error('Missing required parameter: image');
    }

    if (this.activeFunctions.size >= this.maxFunctions) {
      throw new Error(`Maximum functions reached: ${this.maxFunctions}`);
    }

    if (this.securityMode === 'strict') {
      if (!this.validateImage(image)) {
        throw new Error(`Image not allowed in strict mode: ${image}`);
      }
    }

    const args = ['deploy', '--name', name, '--image', image];

    if (this.gatewayUrl) {
      args.push('--gateway', this.gatewayUrl);
    }

    if (env) {
      const envVars = env.split(',');
      envVars.forEach(e => args.push('--env', e));
    }

    if (labels) {
      const labelPairs = labels.split(',');
      labelPairs.forEach(l => args.push('--label', l));
    }

    if (constraints) {
      const constraintList = constraints.split(',');
      constraintList.forEach(c => args.push('--constraint', c));
    }

    if (secrets) {
      const secretList = secrets.split(',');
      secretList.forEach(s => args.push('--secret', s));
    }

    if (namespace) {
      args.push('--namespace', namespace);
    }

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      this.activeFunctions.set(name, {
        name,
        image,
        deployed: new Date().toISOString(),
        env: env || '',
        replicas: 1,
        invocations: 0
      });

      this.log('function_deployed', { name, image });

      return {
        success: true,
        operation: 'deploy',
        function: name,
        image: image,
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to deploy function: ${result.stderr}`);
    }
  }

  validateImage(image) {
    if (this.securityMode === 'permissive') {
      return true;
    }

    if (this.allowedImages.size > 0 && !this.allowedImages.has(image)) {
      return false;
    }

    const registry = image.split('/')[0];
    if (registry.includes('.') && !this.trustedRegistries.has(registry)) {
      return false;
    }

    return true;
  }

  async invokeFunction(params, context) {
    const { name, data, method = 'POST', async = false } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const fn = this.activeFunctions.get(name);
    if (!fn) {
      throw new Error(`Function not found: ${name}`);
    }

    const args = ['invoke', name];

    if (this.gatewayUrl) {
      args.push('--gateway', this.gatewayUrl);
    }

    if (method) {
      args.push('--method', method);
    }

    if (async === 'true' || async === true) {
      args.push('--async');
    }

    let result;
    if (data) {
      result = await this.execFaasCommandWithInput(args, data);
    } else {
      result = await this.execFaasCommand(args);
    }

    if (result.exitCode === 0) {
      fn.invocations = (fn.invocations || 0) + 1;

      return {
        success: true,
        operation: 'invoke',
        function: name,
        output: result.stdout,
        stderr: result.stderr
      };
    } else {
      throw new Error(`Failed to invoke function: ${result.stderr}`);
    }
  }

  async removeFunction(params, context) {
    const { name, namespace } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = ['remove', name];

    if (this.gatewayUrl) {
      args.push('--gateway', this.gatewayUrl);
    }

    if (namespace) {
      args.push('--namespace', namespace);
    }

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      this.activeFunctions.delete(name);

      this.log('function_removed', { name });

      return {
        success: true,
        operation: 'remove',
        function: name,
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to remove function: ${result.stderr}`);
    }
  }

  async scaleFunction(params, context) {
    const { name, replicas, min, max, namespace } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const fn = this.activeFunctions.get(name);
    if (!fn) {
      throw new Error(`Function not found: ${name}`);
    }

    if (replicas) {
      const args = ['scale', name, '--replicas', replicas];

      if (this.gatewayUrl) {
        args.push('--gateway', this.gatewayUrl);
      }

      if (namespace) {
        args.push('--namespace', namespace);
      }

      const result = await this.execFaasCommand(args);

      if (result.exitCode === 0) {
        fn.replicas = parseInt(replicas);

        return {
          success: true,
          operation: 'scale',
          function: name,
          replicas: replicas,
          output: result.stdout
        };
      } else {
        throw new Error(`Failed to scale function: ${result.stderr}`);
      }
    }

    if (min || max) {
      const kubectlArgs = ['autoscale', 'deployment', name];

      if (min) kubectlArgs.push('--min', min);
      if (max) kubectlArgs.push('--max', max);

      if (namespace) {
        kubectlArgs.push('--namespace', namespace);
      }

      const result = await this.execCommand('kubectl', kubectlArgs);

      if (result.exitCode === 0) {
        return {
          success: true,
          operation: 'scale',
          function: name,
          min: min,
          max: max,
          autoscaling: true
        };
      } else {
        throw new Error(`Failed to configure autoscaling: ${result.stderr}`);
      }
    }

    throw new Error('Must specify either replicas or min/max');
  }

  async getFunctionLogs(params, context) {
    const { name, lines = '50', follow = false, since, namespace } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    if (this.detectedBackend === 'kubernetes') {
      const args = ['logs', `deploy/${name}`];

      if (lines) args.push('--tail', lines);
      if (follow === 'true' || follow === true) args.push('--follow');
      if (since) args.push('--since', since);
      if (namespace) args.push('--namespace', namespace);

      const result = await this.execCommand('kubectl', args);

      if (result.exitCode === 0) {
        return {
          success: true,
          operation: 'logs',
          function: name,
          output: result.stdout
        };
      } else {
        throw new Error(`Failed to get logs: ${result.stderr}`);
      }
    } else {
      const args = ['logs', name];

      if (this.gatewayUrl) {
        args.push('--gateway', this.gatewayUrl);
      }

      const result = await this.execFaasCommand(args);

      if (result.exitCode === 0) {
        return {
          success: true,
          operation: 'logs',
          function: name,
          output: result.stdout
        };
      } else {
        throw new Error(`Failed to get logs: ${result.stderr}`);
      }
    }
  }

  async describeFunction(params, context) {
    const { name, namespace } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = ['describe', name];

    if (this.gatewayUrl) {
      args.push('--gateway', this.gatewayUrl);
    }

    if (namespace) {
      args.push('--namespace', namespace);
    }

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'describe',
        function: name,
        details: result.stdout
      };
    } else {
      throw new Error(`Failed to describe function: ${result.stderr}`);
    }
  }

  async newFunction(params, context) {
    const { name, lang = 'python3', prefix, append } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = ['new', name, '--lang', lang];

    if (prefix) args.push('--prefix', prefix);
    if (append) args.push('--append', append);

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'new',
        function: name,
        language: lang,
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to create function template: ${result.stderr}`);
    }
  }

  async buildFunction(params, context) {
    const { name, handler, image, build_arg, no_cache = false } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = ['build'];

    if (handler) {
      args.push('--handler', handler);
    } else {
      args.push('--filter', name);
    }

    if (image) args.push('--image', image);
    if (build_arg) args.push('--build-arg', build_arg);
    if (no_cache === 'true' || no_cache === true) args.push('--no-cache');

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'build',
        function: name,
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to build function: ${result.stderr}`);
    }
  }

  async pushFunction(params, context) {
    const { name, registry } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = ['push', '--filter', name];

    if (registry) args.push('--registry', registry);

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'push',
        function: name,
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to push function: ${result.stderr}`);
    }
  }

  async deployRexxFunction(params, context) {
    const { name, rexx_script, image_base = 'alpine:latest' } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    if (!rexx_script) {
      throw new Error('Missing required parameter: rexx_script');
    }

    const workDir = `/tmp/openfaas-rexx-${name}`;

    if (!this.fs.existsSync(workDir)) {
      this.fs.mkdirSync(workDir, { recursive: true });
    }

    const dockerfile = `FROM ${image_base}
COPY rexx /usr/local/bin/rexx
COPY handler.rexx /app/handler.rexx
RUN chmod +x /usr/local/bin/rexx
WORKDIR /app
CMD ["/usr/local/bin/rexx", "handler.rexx"]
`;

    this.fs.writeFileSync(this.path.join(workDir, 'Dockerfile'), dockerfile);
    this.fs.writeFileSync(this.path.join(workDir, 'handler.rexx'), rexx_script);

    const buildResult = await this.execCommand('docker', [
      'build', '-t', `${name}:latest`, workDir
    ]);

    if (buildResult.exitCode !== 0) {
      throw new Error(`Failed to build RexxJS function: ${buildResult.stderr}`);
    }

    const deployResult = await this.deployFunction({
      name,
      image: `${name}:latest`
    }, context);

    this.fs.rmSync(workDir, { recursive: true, force: true });

    return {
      success: true,
      operation: 'deploy_rexx',
      function: name,
      output: `RexxJS function ${name} deployed successfully`
    };
  }

  async invokeRexxFunction(params, context) {
    const { name, data } = params;

    return await this.invokeFunction({ name, data }, context);
  }

  async listStore(params, context) {
    const result = await this.execFaasCommand(['store', 'list']);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'store_list',
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to list store: ${result.stderr}`);
    }
  }

  async deployFromStore(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = ['store', 'deploy', name];

    if (this.gatewayUrl) {
      args.push('--gateway', this.gatewayUrl);
    }

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      this.activeFunctions.set(name, {
        name,
        fromStore: true,
        deployed: new Date().toISOString()
      });

      return {
        success: true,
        operation: 'store_deploy',
        function: name,
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to deploy from store: ${result.stderr}`);
    }
  }

  async createSecret(params, context) {
    const { name, from_literal, from_file, namespace } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = ['secret', 'create', name];

    if (from_literal) args.push('--from-literal', from_literal);
    if (from_file) args.push('--from-file', from_file);
    if (namespace) args.push('--namespace', namespace);
    if (this.gatewayUrl) args.push('--gateway', this.gatewayUrl);

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'secret_create',
        secret: name,
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to create secret: ${result.stderr}`);
    }
  }

  async listSecrets(params, context) {
    const { namespace } = params;

    const args = ['secret', 'list'];

    if (namespace) args.push('--namespace', namespace);
    if (this.gatewayUrl) args.push('--gateway', this.gatewayUrl);

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'secret_list',
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to list secrets: ${result.stderr}`);
    }
  }

  async createNamespace(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = ['namespaces', 'create', name];

    if (this.gatewayUrl) args.push('--gateway', this.gatewayUrl);

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'namespace_create',
        namespace: name,
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to create namespace: ${result.stderr}`);
    }
  }

  async listNamespaces(params, context) {
    const args = ['namespaces'];

    if (this.gatewayUrl) args.push('--gateway', this.gatewayUrl);

    const result = await this.execFaasCommand(args);

    if (result.exitCode === 0) {
      return {
        success: true,
        operation: 'namespace_list',
        output: result.stdout
      };
    } else {
      throw new Error(`Failed to list namespaces: ${result.stderr}`);
    }
  }

  async handleCleanup(params, context) {
    const { all = false } = params;

    const functionsToRemove = [];

    if (all === 'true' || all === true) {
      this.activeFunctions.forEach((fn, name) => {
        functionsToRemove.push(name);
      });
    }

    for (const name of functionsToRemove) {
      try {
        await this.removeFunction({ name }, context);
      } catch (error) {
        console.error(`Failed to remove function ${name}:`, error.message);
      }
    }

    return {
      success: true,
      operation: 'cleanup',
      cleaned: functionsToRemove.length,
      remaining: this.activeFunctions.size
    };
  }

  async verifyBackend() {
    await this.detectBackend();

    const checks = {
      backend: this.detectedBackend,
      faas_cli: false,
      docker: false,
      kubectl: false,
      swarm_active: false,
      gateway_reachable: false
    };

    const cliCheck = await this.execCommand('faas-cli', ['version']);
    checks.faas_cli = cliCheck.exitCode === 0;

    const dockerCheck = await this.execCommand('docker', ['info']);
    checks.docker = dockerCheck.exitCode === 0;

    if (dockerCheck.exitCode === 0) {
      checks.swarm_active = dockerCheck.stdout.includes('Swarm: active');
    }

    const kubectlCheck = await this.execCommand('kubectl', ['version', '--client']);
    checks.kubectl = kubectlCheck.exitCode === 0;

    try {
      const gatewayCheck = await this.execFaasCommand(['list']);
      checks.gateway_reachable = gatewayCheck.exitCode === 0;
    } catch (e) {
      checks.gateway_reachable = false;
    }

    return {
      success: true,
      operation: 'verify_backend',
      checks: checks,
      ready: checks.faas_cli && checks.docker && checks.gateway_reachable
    };
  }

  async installOpenFaaS(params, context) {
    const { backend = 'swarm' } = params;

    if (backend === 'swarm') {
      const swarmInit = await this.execCommand('docker', ['swarm', 'init']);
      if (swarmInit.exitCode !== 0 && !swarmInit.stderr.includes('already part of a swarm')) {
        throw new Error(`Failed to initialize swarm: ${swarmInit.stderr}`);
      }

      const cloneDir = '/tmp/openfaas-install';
      if (this.fs.existsSync(cloneDir)) {
        this.fs.rmSync(cloneDir, { recursive: true, force: true });
      }

      const gitClone = await this.execCommand('git', [
        'clone', 'https://github.com/openfaas/faas', cloneDir
      ]);

      if (gitClone.exitCode !== 0) {
        throw new Error(`Failed to clone OpenFaaS: ${gitClone.stderr}`);
      }

      const deployScript = this.path.join(cloneDir, 'deploy_stack.sh');
      const deploy = await this.execCommand('bash', [deployScript]);

      if (deploy.exitCode === 0) {
        return {
          success: true,
          operation: 'install',
          backend: 'swarm',
          output: 'OpenFaaS installed on Docker Swarm'
        };
      } else {
        throw new Error(`Failed to deploy OpenFaaS: ${deploy.stderr}`);
      }
    } else {
      throw new Error('Kubernetes installation not yet implemented');
    }
  }

  getSecurityAuditLog() {
    return {
      success: true,
      operation: 'security_audit',
      auditLog: this.auditLog,
      policies: {
        securityMode: this.securityMode,
        maxFunctions: this.maxFunctions,
        allowedImages: Array.from(this.allowedImages),
        trustedRegistries: Array.from(this.trustedRegistries)
      }
    };
  }

  startProcessMonitoring() {
    if (this.processMonitoring.enabled) return;

    this.processMonitoring.enabled = true;
    this.processMonitoring.interval = setInterval(async () => {
      await this.collectProcessStats();
    }, 60000);
  }

  stopProcessMonitoring() {
    if (!this.processMonitoring.enabled) return;

    this.processMonitoring.enabled = false;
    if (this.processMonitoring.interval) {
      clearInterval(this.processMonitoring.interval);
      this.processMonitoring.interval = null;
    }
  }

  async collectProcessStats() {
    try {
      const result = await this.listFunctions();
      if (result.success) {
        result.functions.forEach(fn => {
          this.processMonitoring.stats.set(fn.name, {
            replicas: fn.replicas,
            invocations: fn.invocations,
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.error('Failed to collect process stats:', error);
    }
  }

  getProcessStatistics() {
    return {
      success: true,
      operation: 'process_stats',
      functions: Object.fromEntries(this.processMonitoring.stats),
      monitoring: this.processMonitoring.enabled
    };
  }

  getCheckpointStatus() {
    return {
      success: true,
      operation: 'checkpoint_status',
      enabled: this.checkpointMonitoring.enabled,
      activeFunctions: Array.from(this.checkpointMonitoring.activeFunctions)
    };
  }

  async execFaasCommand(args, options = {}) {
    return this.execCommand('faas-cli', args, options);
  }

  async execFaasCommandWithInput(args, input, options = {}) {
    return new Promise((resolve, reject) => {
      const proc = this.spawn('faas-cli', args, options);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (exitCode) => {
        resolve({ exitCode, stdout, stderr });
      });

      proc.on('error', (error) => {
        reject(error);
      });

      proc.stdin.write(input);
      proc.stdin.end();
    });
  }

  async execCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const proc = this.spawn(command, args, options);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (exitCode) => {
        resolve({ exitCode, stdout, stderr });
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  log(event, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data
    };

    this.auditLog.push(logEntry);

    if (this.auditLog.length > 500) {
      this.auditLog = this.auditLog.slice(-500);
    }
  }

  auditSecurityEvent(event, data = {}) {
    this.log('security_event', { [event]: true, ...data });
  }

  async interpolateMessage(message, context) {
    return message;
  }

  async destroy() {
    this.stopProcessMonitoring();
    this.activeFunctions.clear();
  }
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_OPENFAAS_HANDLER(commandOrMethod, params, sourceContext) {
  // Initialize handler instance if not exists
  if (!openfaasHandlerInstance) {
    openfaasHandlerInstance = new AddressOpenFaaSHandler();
    await openfaasHandlerInstance.initialize();
  }

  // Handle both command strings and method calls
  if (typeof commandOrMethod === 'string' && commandOrMethod.includes(' ')) {
    // Command string format: "deploy name=hello-world image=hello:latest"
    return await openfaasHandlerInstance.handleAddressCommand(commandOrMethod, params, sourceContext);
  } else {
    // Method call format: individual method with params object
    const method = (commandOrMethod || '').toLowerCase();
    return await openfaasHandlerInstance.handleAddressCommand(method, params, sourceContext);
  }
}

const ADDRESS_OPENFAAS_METHODS = {
  'status': 'Get OpenFaaS handler status',
  'list': 'List deployed functions',
  'deploy': 'Deploy a function [image] [env] [labels] [secrets] [namespace]',
  'invoke': 'Invoke a function [data] [method=POST] [async=false]',
  'remove': 'Remove a function [namespace]',
  'scale': 'Scale a function [replicas] or [min] [max] for autoscaling',
  'logs': 'Get function logs [lines=50] [follow=false] [since] [namespace]',
  'describe': 'Describe a function [namespace]',
  'new': 'Create new function template [lang=python3] [prefix] [append]',
  'build': 'Build a function [handler] [image] [build_arg] [no_cache=false]',
  'push': 'Push function image [registry]',
  'deploy_rexx': 'Deploy RexxJS function [rexx_script] [image_base=alpine:latest]',
  'invoke_rexx': 'Invoke RexxJS function [data]',
  'store_list': 'List functions in OpenFaaS store',
  'store_deploy': 'Deploy function from store',
  'secret_create': 'Create secret [from_literal] [from_file] [namespace]',
  'secret_list': 'List secrets [namespace]',
  'namespace_create': 'Create namespace',
  'namespace_list': 'List namespaces',
  'cleanup': 'Remove functions [all=true]',
  'security_audit': 'Get security audit log and policies',
  'start_monitoring': 'Start function monitoring',
  'stop_monitoring': 'Stop function monitoring',
  'process_stats': 'Get function statistics',
  'checkpoint_status': 'Get checkpoint monitoring status',
  'verify_backend': 'Verify backend installation and connectivity',
  'install': 'Install OpenFaaS [backend=swarm|kubernetes]'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OPENFAAS_ADDRESS_META,
    ADDRESS_OPENFAAS_HANDLER,
    ADDRESS_OPENFAAS_METHODS,
    AddressOpenFaaSHandler
  };
}