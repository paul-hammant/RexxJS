// ============================================
// VPC & Networking Handler
// ============================================

const { spawn } = require('child_process');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
} catch (e) {
  // Not available - will use simpler variable resolution
}

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');

class VPCHandler {
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


  async handle(command) {
    const trimmed = command.trim();

    // Apply RexxJS variable interpolation
    const interpolated = this.interpolateVariables(trimmed);
    const upperCommand = interpolated.toUpperCase();

    // Network operations
    if (upperCommand.startsWith('CREATE NETWORK ')) {
      return await this.createNetwork(trimmed.substring(15).trim());
    }
    if (upperCommand.startsWith('DELETE NETWORK ')) {
      return await this.deleteNetwork(trimmed.substring(15).trim());
    }
    if (upperCommand.startsWith('LIST NETWORKS') || upperCommand === 'LIST') {
      return await this.listNetworks();
    }

    // Subnet operations
    if (upperCommand.startsWith('CREATE SUBNET ')) {
      return await this.createSubnet(trimmed.substring(14).trim());
    }
    if (upperCommand.startsWith('DELETE SUBNET ')) {
      return await this.deleteSubnet(trimmed.substring(14).trim());
    }
    if (upperCommand.startsWith('LIST SUBNETS')) {
      return await this.listSubnets(trimmed);
    }

    // Firewall operations
    if (upperCommand.startsWith('CREATE FIREWALL ')) {
      return await this.createFirewall(trimmed.substring(16).trim());
    }
    if (upperCommand.startsWith('DELETE FIREWALL ')) {
      return await this.deleteFirewall(trimmed.substring(16).trim());
    }
    if (upperCommand.startsWith('LIST FIREWALLS') || upperCommand.startsWith('LIST FIREWALL')) {
      return await this.listFirewalls();
    }

    // Route operations
    if (upperCommand.startsWith('CREATE ROUTE ')) {
      return await this.createRoute(trimmed.substring(13).trim());
    }
    if (upperCommand.startsWith('LIST ROUTES')) {
      return await this.listRoutes();
    }

    throw new Error(`Unknown VPC command: ${trimmed.split(' ')[0]}`);
  }

  async createNetwork(params) {
    // Parse: name [subnet-mode=auto|custom] [description="..."]
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const networkName = parsed.name || parts[0];
    const subnetMode = parsed['subnet-mode'] || parsed.mode || 'auto';
    const description = parsed.description || 'Created by RexxJS';

    const cmdParts = [
      'gcloud', 'compute', 'networks', 'create', networkName,
      '--subnet-mode', subnetMode,
      '--description', description,
      '--format', 'json'
    ];

    // Add BGP routing mode if specified
    if (parsed.bgp || parsed['bgp-routing-mode']) {
      cmdParts.push('--bgp-routing-mode', parsed.bgp || parsed['bgp-routing-mode']);
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let networkData = null;
      try {
        const parsed = JSON.parse(result.stdout);
        networkData = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'created',
        network: networkName,
        subnetMode: subnetMode,
        data: networkData,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create network: ${result.stderr || result.stdout}`);
  }

  async deleteNetwork(params) {
    const parts = params.split(/\s+/);
    const networkName = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'compute', 'networks', 'delete', networkName,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        network: networkName,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete network: ${result.stderr || result.stdout}`);
  }

  async listNetworks() {
    const result = await this.executeGcloud([
      'gcloud', 'compute', 'networks', 'list',
      '--format', 'json'
    ]);

    if (result.success) {
      let networks = [];
      try {
        networks = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        networks: networks,
        count: networks.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list networks: ${result.stderr || result.stdout}`);
  }

  async createSubnet(params) {
    // Parse: name network=network-name region=region range=CIDR
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const subnetName = parsed.name || parts[0];
    const network = parsed.network;
    const region = parsed.region || 'us-central1';
    const range = parsed.range || parsed.cidr;

    if (!network || !range) {
      throw new Error('NETWORK and RANGE required. Usage: CREATE SUBNET name network=mynet region=us-central1 range=10.0.0.0/24');
    }

    const cmdParts = [
      'gcloud', 'compute', 'networks', 'subnets', 'create', subnetName,
      '--network', network,
      '--region', region,
      '--range', range,
      '--format', 'json'
    ];

    // Add optional parameters
    if (parsed['private-google-access'] === 'true') {
      cmdParts.push('--enable-private-ip-google-access');
    }
    if (parsed['flow-logs'] === 'true') {
      cmdParts.push('--enable-flow-logs');
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let subnetData = null;
      try {
        const parsed = JSON.parse(result.stdout);
        subnetData = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'created',
        subnet: subnetName,
        network: network,
        region: region,
        range: range,
        data: subnetData,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create subnet: ${result.stderr || result.stdout}`);
  }

  async deleteSubnet(params) {
    // Parse: name [region=us-central1]
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const subnetName = parsed.name || parts[0];
    const region = parsed.region || 'us-central1';

    const result = await this.executeGcloud([
      'gcloud', 'compute', 'networks', 'subnets', 'delete', subnetName,
      '--region', region,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        subnet: subnetName,
        region: region,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete subnet: ${result.stderr || result.stdout}`);
  }

  async listSubnets(params) {
    const parsed = parseKeyValueParams(params);
    const cmdParts = ['gcloud', 'compute', 'networks', 'subnets', 'list', '--format', 'json'];

    if (parsed.network) {
      cmdParts.push('--filter', `network:${parsed.network}`);
    }
    if (parsed.region) {
      cmdParts.push('--filter', `region:${parsed.region}`);
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let subnets = [];
      try {
        subnets = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        subnets: subnets,
        count: subnets.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list subnets: ${result.stderr || result.stdout}`);
  }

  async createFirewall(params) {
    // Parse: name network=net allow=tcp:80,tcp:443 [source-ranges=0.0.0.0/0] [target-tags=web]
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const firewallName = parsed.name || parts[0];
    const network = parsed.network || 'default';
    const allow = parsed.allow;
    const deny = parsed.deny;
    const sourceRanges = parsed['source-ranges'] || parsed.source || '0.0.0.0/0';
    const targetTags = parsed['target-tags'] || parsed.tags;

    if (!allow && !deny) {
      throw new Error('ALLOW or DENY required. Usage: CREATE FIREWALL name network=default allow=tcp:80,tcp:443');
    }

    const cmdParts = [
      'gcloud', 'compute', 'firewall-rules', 'create', firewallName,
      '--network', network,
      '--source-ranges', sourceRanges,
      '--format', 'json'
    ];

    if (allow) {
      cmdParts.push('--allow', allow);
    }
    if (deny) {
      cmdParts.push('--deny', deny);
    }
    if (targetTags) {
      cmdParts.push('--target-tags', targetTags);
    }
    if (parsed.description) {
      cmdParts.push('--description', parsed.description);
    }
    if (parsed.priority) {
      cmdParts.push('--priority', parsed.priority);
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let firewallData = null;
      try {
        const parsed = JSON.parse(result.stdout);
        firewallData = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'created',
        firewall: firewallName,
        network: network,
        allow: allow,
        deny: deny,
        data: firewallData,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create firewall rule: ${result.stderr || result.stdout}`);
  }

  async deleteFirewall(params) {
    const parts = params.split(/\s+/);
    const firewallName = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'compute', 'firewall-rules', 'delete', firewallName,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        firewall: firewallName,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete firewall rule: ${result.stderr || result.stdout}`);
  }

  async listFirewalls() {
    const result = await this.executeGcloud([
      'gcloud', 'compute', 'firewall-rules', 'list',
      '--format', 'json'
    ]);

    if (result.success) {
      let firewalls = [];
      try {
        firewalls = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        firewalls: firewalls,
        count: firewalls.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list firewall rules: ${result.stderr || result.stdout}`);
  }

  async createRoute(params) {
    // Parse: name network=net dest=CIDR next-hop-gateway=default-internet-gateway
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const routeName = parsed.name || parts[0];
    const network = parsed.network || 'default';
    const destRange = parsed.dest || parsed['dest-range'];
    const nextHop = parsed['next-hop-gateway'] || parsed['next-hop-instance'] || parsed['next-hop-ip'];

    if (!destRange || !nextHop) {
      throw new Error('DEST and NEXT-HOP required. Usage: CREATE ROUTE name network=default dest=10.0.0.0/24 next-hop-gateway=default-internet-gateway');
    }

    const cmdParts = [
      'gcloud', 'compute', 'routes', 'create', routeName,
      '--network', network,
      '--destination-range', destRange,
      '--format', 'json'
    ];

    if (parsed['next-hop-gateway']) {
      cmdParts.push('--next-hop-gateway', parsed['next-hop-gateway']);
    } else if (parsed['next-hop-instance']) {
      cmdParts.push('--next-hop-instance', parsed['next-hop-instance']);
    } else if (parsed['next-hop-ip']) {
      cmdParts.push('--next-hop-address', parsed['next-hop-ip']);
    }

    if (parsed.priority) {
      cmdParts.push('--priority', parsed.priority);
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      return {
        success: true,
        action: 'created',
        route: routeName,
        network: network,
        destRange: destRange,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create route: ${result.stderr || result.stdout}`);
  }

  async listRoutes() {
    const result = await this.executeGcloud([
      'gcloud', 'compute', 'routes', 'list',
      '--format', 'json'
    ]);

    if (result.success) {
      let routes = [];
      try {
        routes = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        routes: routes,
        count: routes.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list routes: ${result.stderr || result.stdout}`);
  }

  async executeGcloud(cmdParts) {
    return new Promise((resolve) => {
      const process = spawn(cmdParts[0], cmdParts.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          code: -1,
          stdout: '',
          stderr: error.message
        });
      });
    });
  }
}

module.exports = VPCHandler;
