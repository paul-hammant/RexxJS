/* Cloud Functions Handler - Serverless function execution */

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}


class FunctionsHandler {
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
    const parts = trimmed.split(/\s+/);
    const action = parts[0].toUpperCase();

    switch (action) {
      case 'DEPLOY':
        return await this.deploy(parts.slice(1));
      case 'DELETE':
        return await this.delete(parts[1]);
      case 'INVOKE':
        return await this.invoke(parts.slice(1));
      case 'LIST':
        return await this.list();
      default:
        throw new Error(`Unknown FUNCTIONS command: ${action}`);
    }
  }

  async deploy(params) {
    // DEPLOY name SOURCE 'path' TRIGGER 'http' RUNTIME 'python311' REGION 'us-central1' ENTRYPOINT 'main'
    const name = params[0];
    const sourceIndex = params.findIndex(p => p.toUpperCase() === 'SOURCE');
    const triggerIndex = params.findIndex(p => p.toUpperCase() === 'TRIGGER');
    const runtimeIndex = params.findIndex(p => p.toUpperCase() === 'RUNTIME');
    const regionIndex = params.findIndex(p => p.toUpperCase() === 'REGION');
    const entrypointIndex = params.findIndex(p => p.toUpperCase() === 'ENTRYPOINT');

    const source = sourceIndex >= 0 ? params[sourceIndex + 1].replace(/['"]/g, '') : '.';
    const trigger = triggerIndex >= 0 ? params[triggerIndex + 1].replace(/['"]/g, '') : 'http';
    const runtime = runtimeIndex >= 0 ? params[runtimeIndex + 1].replace(/['"]/g, '') : 'python311';
    const region = regionIndex >= 0 ? params[regionIndex + 1].replace(/['"]/g, '') : 'us-central1';
    const entrypoint = entrypointIndex >= 0 ? params[entrypointIndex + 1].replace(/['"]/g, '') : name.replace(/-/g, '_');

    const args = ['functions', 'deploy', name];
    args.push('--gen2');  // Use 2nd generation Cloud Functions
    args.push('--runtime', runtime);
    args.push('--source', source);
    args.push('--entry-point', entrypoint);
    args.push('--region', region);

    if (trigger === 'http') {
      args.push('--trigger-http', '--allow-unauthenticated');
    } else if (trigger.includes(':')) {
      const [type, resource] = trigger.split(':');
      args.push(`--trigger-${type}`, resource);
    }

    if (this.parent.project) args.push('--project', this.parent.project);

    const result = await this.parent.execCommand('gcloud', args);

    // If deploy succeeded, get function details in JSON format
    if (result.success) {
      const describeArgs = ['functions', 'describe', name, '--region', region, '--format=json'];
      if (this.parent.project) describeArgs.push('--project', this.parent.project);

      const describeResult = await this.parent.execCommand('gcloud', describeArgs);

      if (describeResult.success && describeResult.stdout) {
        try {
          const functionData = JSON.parse(describeResult.stdout);
          return {
            success: true,
            name: name,
            trigger: trigger,
            runtime: runtime,
            region: region,
            entrypoint: entrypoint,
            url: functionData.serviceConfig?.uri || null,
            state: functionData.state,
            updateTime: functionData.updateTime,
            data: functionData,
            stdout: result.stdout,
            stderr: result.stderr
          };
        } catch (e) {
          // JSON parse failed, return basic result
        }
      }
    }

    return {
      success: result.success,
      name: name,
      trigger: trigger,
      runtime: runtime,
      region: region,
      entrypoint: entrypoint,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async delete(functionName) {
    // DELETE function_name [REGION region]
    const args = ['functions', 'delete', functionName, '--quiet'];

    // Note: For 2nd gen functions, region is required; for 1st gen, it's optional
    // We'll let gcloud handle the default
    if (this.parent.region) args.push('--region', this.parent.region);
    if (this.parent.project) args.push('--project', this.parent.project);

    const result = await this.parent.execCommand('gcloud', args);

    return {
      success: result.success,
      name: functionName,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async invoke(params) {
    // INVOKE function_name [DATA '{"key":"value"}']
    const name = params[0];
    const dataIndex = params.findIndex(p => p.toUpperCase() === 'DATA');
    const data = dataIndex >= 0 ? params[dataIndex + 1].replace(/^['"]|['"]$/g, '') : null;

    const args = ['functions', 'call', name];

    if (data) args.push('--data', data);
    if (this.parent.region) args.push('--region', this.parent.region);
    if (this.parent.project) args.push('--project', this.parent.project);

    const result = await this.parent.execCommand('gcloud', args);

    return {
      success: result.success,
      name: name,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async list() {
    // LIST all functions
    const args = ['functions', 'list', '--format', 'json'];

    if (this.parent.project) args.push('--project', this.parent.project);

    const result = await this.parent.execCommand('gcloud', args);

    let functions = [];
    if (result.success && result.stdout) {
      try {
        functions = JSON.parse(result.stdout);
      } catch (e) {
        // Failed to parse JSON
      }
    }

    return {
      success: result.success,
      functions: functions,
      count: functions.length,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }
}

module.exports = FunctionsHandler;
