/**
 * Cloud Load Balancing Handler
 *
 * Manages HTTP(S) Load Balancing resources including:
 * - Backend services
 * - URL maps
 * - Target proxies (HTTP/HTTPS)
 * - Forwarding rules
 * - Health checks
 * - SSL certificates
 *
 * Supports both imperative (key=value) and declarative (block) syntax.
 */

const fs = require('fs');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}

const os = require('os');
const path = require('path');
const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
const { DeclarativeParser, toGcpYaml } = require('../../../shared-utils/declarative-parser.js');

class LoadBalancingHandler {
  constructor(parent) {
    this.parent = parent;
  }
  /**
   * Interpolate variables using RexxJS global interpolation pattern
   */
  interpolateVariables(str) {
    if (!interpolationConfig) {
      return str;
    }

    const variablePool = this.parent.variablePool || {};
    const pattern = interpolationConfig.getCurrentPattern();

    if (!pattern.hasDelims(str)) {
      return str;
    }

    return str.replace(pattern.regex, (match) => {
      const varName = pattern.extractVar(match);

      if (varName in variablePool) {
        return variablePool[varName];
      }

      return match; // Variable not found - leave as-is
    });
  }


  async initialize() {
    // No special initialization needed
  }

  async handle(command) {
    const upperCommand = command.toUpperCase().trim();

    // Check for declarative block syntax: LOAD-BALANCER name WITH ... END
    if (upperCommand.match(/^LOAD-BALANCER\s+\S+\s+WITH/)) {
      return await this.createLoadBalancerDeclarative(command);
    }

    // Backend services
    if (upperCommand.startsWith('CREATE BACKEND-SERVICE') || upperCommand.startsWith('CREATE BACKEND')) {
      return await this.createBackendService(command);
    }
    if (upperCommand.startsWith('DELETE BACKEND-SERVICE') || upperCommand.startsWith('DELETE BACKEND')) {
      return await this.deleteBackendService(command);
    }
    if (upperCommand.startsWith('LIST BACKEND-SERVICES') || upperCommand.startsWith('LIST BACKENDS')) {
      return await this.listBackendServices(command);
    }
    if (upperCommand.startsWith('UPDATE BACKEND-SERVICE') || upperCommand.startsWith('UPDATE BACKEND')) {
      return await this.updateBackendService(command);
    }
    if (upperCommand.startsWith('ADD-BACKEND')) {
      return await this.addBackend(command);
    }

    // URL maps
    if (upperCommand.startsWith('CREATE URL-MAP')) {
      return await this.createUrlMap(command);
    }
    if (upperCommand.startsWith('DELETE URL-MAP')) {
      return await this.deleteUrlMap(command);
    }
    if (upperCommand.startsWith('LIST URL-MAPS')) {
      return await this.listUrlMaps(command);
    }

    // Target proxies
    if (upperCommand.startsWith('CREATE TARGET-HTTP-PROXY')) {
      return await this.createTargetHttpProxy(command);
    }
    if (upperCommand.startsWith('CREATE TARGET-HTTPS-PROXY')) {
      return await this.createTargetHttpsProxy(command);
    }
    if (upperCommand.startsWith('LIST TARGET-HTTP-PROXIES')) {
      return await this.listTargetHttpProxies(command);
    }
    if (upperCommand.startsWith('LIST TARGET-HTTPS-PROXIES')) {
      return await this.listTargetHttpsProxies(command);
    }

    // Forwarding rules
    if (upperCommand.startsWith('CREATE FORWARDING-RULE')) {
      return await this.createForwardingRule(command);
    }
    if (upperCommand.startsWith('DELETE FORWARDING-RULE')) {
      return await this.deleteForwardingRule(command);
    }
    if (upperCommand.startsWith('LIST FORWARDING-RULES')) {
      return await this.listForwardingRules(command);
    }

    // Health checks
    if (upperCommand.startsWith('CREATE HEALTH-CHECK')) {
      return await this.createHealthCheck(command);
    }
    if (upperCommand.startsWith('DELETE HEALTH-CHECK')) {
      return await this.deleteHealthCheck(command);
    }
    if (upperCommand.startsWith('LIST HEALTH-CHECKS')) {
      return await this.listHealthChecks(command);
    }

    // SSL certificates
    if (upperCommand.startsWith('CREATE SSL-CERTIFICATE')) {
      return await this.createSslCertificate(command);
    }
    if (upperCommand.startsWith('LIST SSL-CERTIFICATES')) {
      return await this.listSslCertificates(command);
    }

    throw new Error('Unknown Load Balancing command: ' + command);
  }

  async createBackendService(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    if (!name) {
      throw new Error('Backend service name is required');
    }

    const protocol = params.protocol || 'HTTP';
    const healthCheck = params['health-check'];
    const global = params.global !== 'false';

    const args = ['compute', 'backend-services', 'create', name];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    args.push('--protocol', protocol);

    if (healthCheck) {
      args.push('--health-checks', healthCheck);
    }

    if (params['port-name']) {
      args.push('--port-name', params['port-name']);
    }

    if (params.timeout) {
      args.push('--timeout', params.timeout);
    }

    if (params['enable-cdn'] === 'true') {
      args.push('--enable-cdn');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_backend_service',
      data: { name, protocol, global },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteBackendService(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    if (!name) {
      throw new Error('Backend service name is required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'backend-services', 'delete', name, '--quiet'];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_backend_service',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listBackendServices(command) {
    const params = parseKeyValueParams(command);
    const args = ['compute', 'backend-services', 'list', '--format', 'json'];

    if (params.filter) {
      args.push('--filter', params.filter);
    }

    const result = await this.executeGcloud(args);

    let services = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        services = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_backend_services',
      data: { services, count: services.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async updateBackendService(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    if (!name) {
      throw new Error('Backend service name is required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'backend-services', 'update', name];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    if (params.timeout) {
      args.push('--timeout', params.timeout);
    }

    if (params['enable-cdn'] === 'true') {
      args.push('--enable-cdn');
    } else if (params['enable-cdn'] === 'false') {
      args.push('--no-enable-cdn');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'update_backend_service',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async addBackend(command) {
    const params = parseKeyValueParams(command);
    const backendService = params['backend-service'];
    const instanceGroup = params['instance-group'];

    if (!backendService || !instanceGroup) {
      throw new Error('Both backend-service and instance-group are required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'backend-services', 'add-backend', backendService];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    args.push('--instance-group', instanceGroup);

    if (params['instance-group-zone']) {
      args.push('--instance-group-zone', params['instance-group-zone']);
    }

    if (params['balancing-mode']) {
      args.push('--balancing-mode', params['balancing-mode']);
    }

    if (params['max-utilization']) {
      args.push('--max-utilization', params['max-utilization']);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'add_backend',
      data: { backendService, instanceGroup },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createUrlMap(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const defaultService = params['default-service'];

    if (!name || !defaultService) {
      throw new Error('Both name and default-service are required');
    }

    const args = ['compute', 'url-maps', 'create', name];
    args.push('--default-service', defaultService);

    if (params.global !== 'false') {
      args.push('--global');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_url_map',
      data: { name, defaultService },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteUrlMap(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    if (!name) {
      throw new Error('URL map name is required');
    }

    const args = ['compute', 'url-maps', 'delete', name, '--quiet'];

    if (params.global !== 'false') {
      args.push('--global');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_url_map',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listUrlMaps(command) {
    const args = ['compute', 'url-maps', 'list', '--format', 'json'];
    const result = await this.executeGcloud(args);

    let maps = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        maps = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_url_maps',
      data: { maps, count: maps.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createTargetHttpProxy(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const urlMap = params['url-map'];

    if (!name || !urlMap) {
      throw new Error('Both name and url-map are required');
    }

    const args = ['compute', 'target-http-proxies', 'create', name];
    args.push('--url-map', urlMap);

    if (params.global !== 'false') {
      args.push('--global');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_target_http_proxy',
      data: { name, urlMap },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createTargetHttpsProxy(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const urlMap = params['url-map'];
    const sslCertificates = params['ssl-certificates'];

    if (!name || !urlMap || !sslCertificates) {
      throw new Error('name, url-map, and ssl-certificates are required');
    }

    const args = ['compute', 'target-https-proxies', 'create', name];
    args.push('--url-map', urlMap);
    args.push('--ssl-certificates', sslCertificates);

    if (params.global !== 'false') {
      args.push('--global');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_target_https_proxy',
      data: { name, urlMap, sslCertificates },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listTargetHttpProxies(command) {
    const args = ['compute', 'target-http-proxies', 'list', '--format', 'json'];
    const result = await this.executeGcloud(args);

    let proxies = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        proxies = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_target_http_proxies',
      data: { proxies, count: proxies.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listTargetHttpsProxies(command) {
    const args = ['compute', 'target-https-proxies', 'list', '--format', 'json'];
    const result = await this.executeGcloud(args);

    let proxies = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        proxies = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_target_https_proxies',
      data: { proxies, count: proxies.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createForwardingRule(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const target = params['target-http-proxy'] || params['target-https-proxy'];

    if (!name) {
      throw new Error('Forwarding rule name is required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'forwarding-rules', 'create', name];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    if (params['target-http-proxy']) {
      args.push('--target-http-proxy', params['target-http-proxy']);
    } else if (params['target-https-proxy']) {
      args.push('--target-https-proxy', params['target-https-proxy']);
    }

    if (params['ip-protocol']) {
      args.push('--ip-protocol', params['ip-protocol']);
    }

    if (params.ports) {
      args.push('--ports', params.ports);
    }

    if (params.address) {
      args.push('--address', params.address);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_forwarding_rule',
      data: { name, target },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteForwardingRule(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    if (!name) {
      throw new Error('Forwarding rule name is required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'forwarding-rules', 'delete', name, '--quiet'];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_forwarding_rule',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listForwardingRules(command) {
    const params = parseKeyValueParams(command);
    const args = ['compute', 'forwarding-rules', 'list', '--format', 'json'];

    if (params.filter) {
      args.push('--filter', params.filter);
    }

    const result = await this.executeGcloud(args);

    let rules = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        rules = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_forwarding_rules',
      data: { rules, count: rules.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createHealthCheck(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    if (!name) {
      throw new Error('Health check name is required');
    }

    const protocol = params.protocol || 'HTTP';
    const args = ['compute', 'health-checks', 'create', protocol.toLowerCase(), name];

    if (params.port) {
      args.push('--port', params.port);
    }

    if (params['request-path']) {
      args.push('--request-path', params['request-path']);
    }

    if (params['check-interval']) {
      args.push('--check-interval', params['check-interval']);
    }

    if (params.timeout) {
      args.push('--timeout', params.timeout);
    }

    if (params['healthy-threshold']) {
      args.push('--healthy-threshold', params['healthy-threshold']);
    }

    if (params['unhealthy-threshold']) {
      args.push('--unhealthy-threshold', params['unhealthy-threshold']);
    }

    if (params.global !== 'false') {
      args.push('--global');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_health_check',
      data: { name, protocol },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteHealthCheck(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    if (!name) {
      throw new Error('Health check name is required');
    }

    const args = ['compute', 'health-checks', 'delete', name, '--quiet'];

    if (params.global !== 'false') {
      args.push('--global');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_health_check',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listHealthChecks(command) {
    const args = ['compute', 'health-checks', 'list', '--format', 'json'];
    const result = await this.executeGcloud(args);

    let checks = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        checks = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_health_checks',
      data: { checks, count: checks.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createSslCertificate(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const domains = params.domains;

    if (!name || !domains) {
      throw new Error('Both name and domains are required');
    }

    const args = ['compute', 'ssl-certificates', 'create', name];

    // Managed certificate
    if (params.managed === 'true') {
      args.push('--domains', domains);
      args.push('--global');
    } else {
      // Self-managed certificate
      if (!params.certificate || !params['private-key']) {
        throw new Error('certificate and private-key are required for self-managed certificates');
      }
      args.push('--certificate', params.certificate);
      args.push('--private-key', params['private-key']);

      if (params.global !== 'false') {
        args.push('--global');
      }
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_ssl_certificate',
      data: { name, domains, managed: params.managed === 'true' },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listSslCertificates(command) {
    const args = ['compute', 'ssl-certificates', 'list', '--format', 'json'];
    const result = await this.executeGcloud(args);

    let certificates = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        certificates = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_ssl_certificates',
      data: { certificates, count: certificates.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  /**
   * Create a complete load balancer using declarative block syntax
   *
   * Example:
   *   LOAD-BALANCER my-lb WITH
   *     backend_service "web-backend" {
   *       protocol HTTP
   *       health_check { port 80 }
   *     }
   *     frontend { port 80 }
   *   END
   */
  async createLoadBalancerDeclarative(command) {
    // Extract load balancer name
    const nameMatch = command.match(/LOAD-BALANCER\s+(\S+)\s+WITH/i);
    if (!nameMatch) {
      throw new Error('Load balancer name is required: LOAD-BALANCER <name> WITH ... END');
    }
    const lbName = nameMatch[1];

    // Extract the declarative block between WITH and END
    const blockMatch = command.match(/WITH\s+([\s\S]+?)\s+END/i);
    if (!blockMatch) {
      throw new Error('Declarative syntax requires WITH...END block');
    }
    const blockContent = blockMatch[1];

    // Parse the declarative block with variable pool from parent
    // Variable pool is read-only, passed from RexxJS interpreter
    const variablePool = this.parent.variablePool || {};
    const parser = new DeclarativeParser(variablePool);
    let parsed;
    try {
      parsed = parser.parse(blockContent);
    } catch (e) {
      throw new Error(`Failed to parse declarative block: ${e.message}`);
    }

    // Track resources created for rollback on failure
    const created = {
      healthChecks: [],
      backendServices: [],
      urlMaps: [],
      targetProxies: [],
      forwardingRules: []
    };

    try {
      // Step 1: Create health checks (if specified)
      if (parsed.backend_service && parsed.backend_service.health_check) {
        const hcName = `${lbName}-health-check`;
        await this.createHealthCheckFromDeclarative(hcName, parsed.backend_service.health_check);
        created.healthChecks.push(hcName);
      }

      // Step 2: Create backend service
      if (parsed.backend_service) {
        const backendName = parsed.backend_service.name || lbName;
        await this.createBackendServiceFromDeclarative(backendName, parsed.backend_service, created.healthChecks[0]);
        created.backendServices.push(backendName);
      }

      // Step 3: Create URL map
      const urlMapName = parsed.url_map?.name || `${lbName}-url-map`;
      await this.createUrlMapFromDeclarative(urlMapName, parsed.url_map || {}, created.backendServices[0]);
      created.urlMaps.push(urlMapName);

      // Step 4: Create target proxy
      const proxyName = `${lbName}-proxy`;
      const isHttps = parsed.frontend?.protocol?.toUpperCase() === 'HTTPS';

      if (isHttps) {
        // Create SSL certificate if needed
        if (parsed.frontend.ssl_certificate) {
          const certName = `${lbName}-cert`;
          await this.createSslCertificateFromDeclarative(certName, parsed.frontend.ssl_certificate);
        }
        await this.createTargetHttpsProxyFromDeclarative(proxyName, urlMapName, `${lbName}-cert`);
      } else {
        await this.createTargetHttpProxyFromDeclarative(proxyName, urlMapName);
      }
      created.targetProxies.push(proxyName);

      // Step 5: Create forwarding rule
      const ruleName = parsed.frontend?.name || `${lbName}-rule`;
      await this.createForwardingRuleFromDeclarative(ruleName, parsed.frontend || {}, proxyName, isHttps);
      created.forwardingRules.push(ruleName);

      return {
        success: true,
        action: 'create_load_balancer_declarative',
        data: {
          name: lbName,
          resources: created
        },
        stdout: `Load balancer '${lbName}' created successfully with declarative syntax`,
        stderr: ''
      };

    } catch (error) {
      // Rollback on failure (delete created resources in reverse order)
      console.error(`Failed to create load balancer: ${error.message}`);
      console.error('Rolling back created resources...');

      // TODO: Implement rollback logic

      throw new Error(`Failed to create load balancer '${lbName}': ${error.message}`);
    }
  }

  /**
   * Helper: Create health check from declarative config
   */
  async createHealthCheckFromDeclarative(name, config) {
    const protocol = config.protocol || 'HTTP';
    const args = ['compute', 'health-checks', 'create', protocol.toLowerCase(), name];

    if (config.port) args.push('--port', String(config.port));
    if (config.request_path) args.push('--request-path', config.request_path);
    if (config.check_interval) args.push('--check-interval', config.check_interval);
    if (config.timeout) args.push('--timeout', config.timeout);
    if (config.healthy_threshold) args.push('--healthy-threshold', String(config.healthy_threshold));
    if (config.unhealthy_threshold) args.push('--unhealthy-threshold', String(config.unhealthy_threshold));

    args.push('--global');

    const result = await this.executeGcloud(args);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create health check: ${result.stderr}`);
    }
  }

  /**
   * Helper: Create backend service from declarative config
   */
  async createBackendServiceFromDeclarative(name, config, healthCheckName) {
    const args = ['compute', 'backend-services', 'create', name];

    args.push('--protocol', config.protocol || 'HTTP');
    args.push('--global');

    if (healthCheckName) {
      args.push('--health-checks', healthCheckName);
    }

    if (config.port_name) args.push('--port-name', config.port_name);
    if (config.timeout) args.push('--timeout', config.timeout);

    if (config.cdn?.enabled) {
      args.push('--enable-cdn');
    }

    const result = await this.executeGcloud(args);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create backend service: ${result.stderr}`);
    }

    // Add backends if specified
    if (config.backend) {
      const backend = config.backend;
      const backendArgs = ['compute', 'backend-services', 'add-backend', name, '--global'];

      if (backend.instance_group) {
        backendArgs.push('--instance-group', backend.instance_group.split('/').pop());
        const zone = backend.instance_group.match(/zones\/([^/]+)/)?.[1];
        if (zone) backendArgs.push('--instance-group-zone', zone);
      }

      if (backend.balancing_mode) backendArgs.push('--balancing-mode', backend.balancing_mode);
      if (backend.max_utilization) backendArgs.push('--max-utilization', String(backend.max_utilization));
      if (backend.max_rate_per_instance) backendArgs.push('--max-rate-per-instance', String(backend.max_rate_per_instance));

      await this.executeGcloud(backendArgs);
    }
  }

  /**
   * Helper: Create URL map from declarative config
   */
  async createUrlMapFromDeclarative(name, config, defaultService) {
    const args = ['compute', 'url-maps', 'create', name];
    args.push('--default-service', config.default_service || defaultService);
    args.push('--global');

    const result = await this.executeGcloud(args);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create URL map: ${result.stderr}`);
    }
  }

  /**
   * Helper: Create target HTTP proxy from declarative config
   */
  async createTargetHttpProxyFromDeclarative(name, urlMapName) {
    const args = ['compute', 'target-http-proxies', 'create', name];
    args.push('--url-map', urlMapName);
    args.push('--global');

    const result = await this.executeGcloud(args);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create target HTTP proxy: ${result.stderr}`);
    }
  }

  /**
   * Helper: Create target HTTPS proxy from declarative config
   */
  async createTargetHttpsProxyFromDeclarative(name, urlMapName, certName) {
    const args = ['compute', 'target-https-proxies', 'create', name];
    args.push('--url-map', urlMapName);
    args.push('--ssl-certificates', certName);
    args.push('--global');

    const result = await this.executeGcloud(args);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create target HTTPS proxy: ${result.stderr}`);
    }
  }

  /**
   * Helper: Create SSL certificate from declarative config
   */
  async createSslCertificateFromDeclarative(name, config) {
    const args = ['compute', 'ssl-certificates', 'create', name];

    if (config.managed && config.domains) {
      const domains = Array.isArray(config.domains) ? config.domains.join(',') : config.domains;
      args.push('--domains', domains);
    } else if (config.certificate && config.private_key) {
      args.push('--certificate', config.certificate);
      args.push('--private-key', config.private_key);
    }

    args.push('--global');

    const result = await this.executeGcloud(args);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create SSL certificate: ${result.stderr}`);
    }
  }

  /**
   * Helper: Create forwarding rule from declarative config
   */
  async createForwardingRuleFromDeclarative(name, config, targetProxy, isHttps) {
    const args = ['compute', 'forwarding-rules', 'create', name];
    args.push('--global');

    if (isHttps) {
      args.push('--target-https-proxy', targetProxy);
      args.push('--ports', config.port || '443');
    } else {
      args.push('--target-http-proxy', targetProxy);
      args.push('--ports', config.port || '80');
    }

    if (config.ip_address) {
      args.push('--address', config.ip_address);
    }

    if (config.ip_protocol) {
      args.push('--ip-protocol', config.ip_protocol);
    }

    const result = await this.executeGcloud(args);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create forwarding rule: ${result.stderr}`);
    }
  }

  getInfo() {
    return {
      service: 'load-balancing',
      description: 'Cloud Load Balancing - Distribute traffic across resources',
      commands: {
        'Create backend service': 'LOAD-BALANCING CREATE BACKEND-SERVICE name=my-backend protocol=HTTP health-check=my-health-check',
        'List backend services': 'LOAD-BALANCING LIST BACKEND-SERVICES',
        'Create URL map': 'LOAD-BALANCING CREATE URL-MAP name=my-map default-service=my-backend',
        'Create target HTTP proxy': 'LOAD-BALANCING CREATE TARGET-HTTP-PROXY name=my-proxy url-map=my-map',
        'Create forwarding rule': 'LOAD-BALANCING CREATE FORWARDING-RULE name=my-rule target-http-proxy=my-proxy ports=80',
        'Create health check': 'LOAD-BALANCING CREATE HEALTH-CHECK name=my-check protocol=HTTP port=80',
        'Create SSL certificate': 'LOAD-BALANCING CREATE SSL-CERTIFICATE name=my-cert domains=example.com managed=true',
        'Declarative load balancer': 'LOAD-BALANCER my-lb WITH backend_service "web" { protocol HTTP } END'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = LoadBalancingHandler;
