// ============================================
// Cloud CDN Handler
// ============================================

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}


class CloudCDNHandler {
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

    if (upperCommand.startsWith('ENABLE')) {
      return await this.enableCdn(command);
    }
    if (upperCommand.startsWith('DISABLE')) {
      return await this.disableCdn(command);
    }
    if (upperCommand.startsWith('INVALIDATE') || upperCommand.startsWith('CLEAR-CACHE')) {
      return await this.invalidateCache(command);
    }
    if (upperCommand.startsWith('UPDATE CACHE-KEY-POLICY')) {
      return await this.updateCacheKeyPolicy(command);
    }
    if (upperCommand.startsWith('GET STATUS')) {
      return await this.getStatus(command);
    }

    throw new Error('Unknown Cloud CDN command: ' + command);
  }

  async enableCdn(command) {
    const params = parseKeyValueParams(command);
    const backendService = params['backend-service'];

    if (!backendService) {
      throw new Error('backend-service is required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'backend-services', 'update', backendService];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    args.push('--enable-cdn');

    if (params['cache-mode']) {
      args.push('--cache-mode', params['cache-mode']);
    }

    if (params['default-ttl']) {
      args.push('--default-ttl', params['default-ttl']);
    }

    if (params['max-ttl']) {
      args.push('--max-ttl', params['max-ttl']);
    }

    if (params['client-ttl']) {
      args.push('--client-ttl', params['client-ttl']);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'enable_cdn',
      data: { backendService },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async disableCdn(command) {
    const params = parseKeyValueParams(command);
    const backendService = params['backend-service'];

    if (!backendService) {
      throw new Error('backend-service is required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'backend-services', 'update', backendService];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    args.push('--no-enable-cdn');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'disable_cdn',
      data: { backendService },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async invalidateCache(command) {
    const params = parseKeyValueParams(command);
    const urlMap = params['url-map'];
    const path = params.path || '/*';

    if (!urlMap) {
      throw new Error('url-map is required');
    }

    const args = ['compute', 'url-maps', 'invalidate-cdn-cache', urlMap];
    args.push('--path', path);

    if (params.host) {
      args.push('--host', params.host);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'invalidate_cache',
      data: { urlMap, path },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async updateCacheKeyPolicy(command) {
    const params = parseKeyValueParams(command);
    const backendService = params['backend-service'];

    if (!backendService) {
      throw new Error('backend-service is required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'backend-services', 'update', backendService];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    if (params['cache-key-include-protocol'] === 'true') {
      args.push('--cache-key-include-protocol');
    }

    if (params['cache-key-include-host'] === 'true') {
      args.push('--cache-key-include-host');
    }

    if (params['cache-key-include-query-string'] === 'true') {
      args.push('--cache-key-include-query-string');
    }

    if (params['cache-key-query-string-whitelist']) {
      args.push('--cache-key-query-string-whitelist', params['cache-key-query-string-whitelist']);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'update_cache_key_policy',
      data: { backendService },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async getStatus(command) {
    const params = parseKeyValueParams(command);
    const backendService = params['backend-service'];

    if (!backendService) {
      throw new Error('backend-service is required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'backend-services', 'describe', backendService, '--format', 'json'];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    const result = await this.executeGcloud(args);

    let status = null;
    if (result.exitCode === 0 && result.stdout) {
      try {
        const service = JSON.parse(result.stdout);
        status = {
          cdnEnabled: service.enableCDN || false,
          cacheMode: service.cdnPolicy?.cacheMode,
          defaultTtl: service.cdnPolicy?.defaultTtl,
          maxTtl: service.cdnPolicy?.maxTtl,
          clientTtl: service.cdnPolicy?.clientTtl
        };
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'get_cdn_status',
      data: { backendService, status },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      service: 'cdn',
      description: 'Cloud CDN - Content delivery network for low-latency content',
      commands: {
        'Enable CDN': 'CDN ENABLE backend-service=my-backend cache-mode=CACHE_ALL_STATIC default-ttl=3600',
        'Disable CDN': 'CDN DISABLE backend-service=my-backend',
        'Invalidate cache': 'CDN INVALIDATE url-map=my-map path=/images/*',
        'Update cache key policy': 'CDN UPDATE CACHE-KEY-POLICY backend-service=my-backend cache-key-include-query-string=true',
        'Get CDN status': 'CDN GET STATUS backend-service=my-backend'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = CloudCDNHandler;
