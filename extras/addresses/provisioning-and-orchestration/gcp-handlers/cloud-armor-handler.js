// ============================================
// Cloud Armor Handler
// ============================================

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}


class CloudArmorHandler {
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

    // Security policies
    if (upperCommand.startsWith('CREATE POLICY')) {
      return await this.createPolicy(command);
    }
    if (upperCommand.startsWith('DELETE POLICY')) {
      return await this.deletePolicy(command);
    }
    if (upperCommand.startsWith('LIST POLICIES')) {
      return await this.listPolicies(command);
    }
    if (upperCommand.startsWith('DESCRIBE POLICY')) {
      return await this.describePolicy(command);
    }

    // Security rules
    if (upperCommand.startsWith('ADD RULE')) {
      return await this.addRule(command);
    }
    if (upperCommand.startsWith('UPDATE RULE')) {
      return await this.updateRule(command);
    }
    if (upperCommand.startsWith('DELETE RULE')) {
      return await this.deleteRule(command);
    }
    if (upperCommand.startsWith('LIST RULES')) {
      return await this.listRules(command);
    }

    // Attach/detach policies
    if (upperCommand.startsWith('ATTACH')) {
      return await this.attachPolicy(command);
    }
    if (upperCommand.startsWith('DETACH')) {
      return await this.detachPolicy(command);
    }

    throw new Error('Unknown Cloud Armor command: ' + command);
  }

  async createPolicy(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;

    if (!name) {
      throw new Error('Policy name is required');
    }

    const args = ['compute', 'security-policies', 'create', name];

    if (params.description) {
      args.push('--description', params.description);
    }

    if (params.type) {
      args.push('--type', params.type);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_policy',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deletePolicy(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;

    if (!name) {
      throw new Error('Policy name is required');
    }

    const args = ['compute', 'security-policies', 'delete', name, '--quiet'];

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_policy',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listPolicies(command) {
    const args = ['compute', 'security-policies', 'list', '--format', 'json'];
    const result = await this.executeGcloud(args);

    let policies = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        policies = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_policies',
      data: { policies, count: policies.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describePolicy(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;

    if (!name) {
      throw new Error('Policy name is required');
    }

    const args = ['compute', 'security-policies', 'describe', name, '--format', 'json'];

    const result = await this.executeGcloud(args);

    let policy = null;
    if (result.exitCode === 0 && result.stdout) {
      try {
        policy = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'describe_policy',
      data: { name, policy },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async addRule(command) {
    const params = parseKeyValueParams(command);
    const policy = params.policy;
    const priority = params.priority;

    if (!policy || !priority) {
      throw new Error('Both policy and priority are required');
    }

    const args = ['compute', 'security-policies', 'rules', 'create', priority];
    args.push('--security-policy', policy);

    // Action
    if (params.action) {
      args.push('--action', params.action); // allow, deny-403, deny-404, deny-502, rate-based-ban
    }

    // Source IP ranges
    if (params['src-ip-ranges']) {
      args.push('--src-ip-ranges', params['src-ip-ranges']);
    }

    // Expression (advanced rules)
    if (params.expression) {
      args.push('--expression', params.expression);
    }

    // Preview mode
    if (params.preview === 'true') {
      args.push('--preview');
    }

    // Rate limiting
    if (params['rate-limit-threshold-count']) {
      args.push('--rate-limit-threshold-count', params['rate-limit-threshold-count']);
    }

    if (params['rate-limit-threshold-interval-sec']) {
      args.push('--rate-limit-threshold-interval-sec', params['rate-limit-threshold-interval-sec']);
    }

    if (params['ban-duration-sec']) {
      args.push('--ban-duration-sec', params['ban-duration-sec']);
    }

    // Description
    if (params.description) {
      args.push('--description', params.description);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'add_rule',
      data: { policy, priority, action: params.action },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async updateRule(command) {
    const params = parseKeyValueParams(command);
    const policy = params.policy;
    const priority = params.priority;

    if (!policy || !priority) {
      throw new Error('Both policy and priority are required');
    }

    const args = ['compute', 'security-policies', 'rules', 'update', priority];
    args.push('--security-policy', policy);

    if (params.action) {
      args.push('--action', params.action);
    }

    if (params['src-ip-ranges']) {
      args.push('--src-ip-ranges', params['src-ip-ranges']);
    }

    if (params.expression) {
      args.push('--expression', params.expression);
    }

    if (params.description) {
      args.push('--description', params.description);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'update_rule',
      data: { policy, priority },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteRule(command) {
    const params = parseKeyValueParams(command);
    const policy = params.policy;
    const priority = params.priority;

    if (!policy || !priority) {
      throw new Error('Both policy and priority are required');
    }

    const args = ['compute', 'security-policies', 'rules', 'delete', priority];
    args.push('--security-policy', policy);
    args.push('--quiet');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_rule',
      data: { policy, priority },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listRules(command) {
    const params = parseKeyValueParams(command);
    const policy = params.policy;

    if (!policy) {
      throw new Error('Policy name is required');
    }

    const args = ['compute', 'security-policies', 'rules', 'describe', '2147483647']; // Default rule
    args.push('--security-policy', policy);
    args.push('--format', 'json');

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
      action: 'list_rules',
      data: { policy, rules },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async attachPolicy(command) {
    const params = parseKeyValueParams(command);
    const backendService = params['backend-service'];
    const policy = params.policy;

    if (!backendService || !policy) {
      throw new Error('Both backend-service and policy are required');
    }

    const global = params.global !== 'false';
    const args = ['compute', 'backend-services', 'update', backendService];

    if (global) {
      args.push('--global');
    } else if (params.region) {
      args.push('--region', params.region);
    }

    args.push('--security-policy', policy);

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'attach_policy',
      data: { backendService, policy },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async detachPolicy(command) {
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

    args.push('--security-policy', '');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'detach_policy',
      data: { backendService },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      service: 'armor',
      description: 'Cloud Armor - DDoS protection and WAF for applications',
      commands: {
        'Create policy': 'ARMOR CREATE POLICY name=my-policy description="Block malicious traffic"',
        'List policies': 'ARMOR LIST POLICIES',
        'Add deny rule': 'ARMOR ADD RULE policy=my-policy priority=1000 action=deny-403 src-ip-ranges=192.0.2.0/24',
        'Add rate limit rule': 'ARMOR ADD RULE policy=my-policy priority=2000 action=rate-based-ban rate-limit-threshold-count=100 rate-limit-threshold-interval-sec=60',
        'Attach policy': 'ARMOR ATTACH backend-service=my-backend policy=my-policy',
        'Detach policy': 'ARMOR DETACH backend-service=my-backend'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = CloudArmorHandler;
