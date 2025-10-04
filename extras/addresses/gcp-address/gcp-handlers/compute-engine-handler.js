// ============================================
// Compute Engine Handler
// ============================================

const { spawn } = require('child_process');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
} catch (e) {
  // Not available - will use simpler variable resolution
}

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');

class ComputeEngineHandler {
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

    // Instance lifecycle management
    if (upperCommand.startsWith('CREATE INSTANCE ') || upperCommand.startsWith('CREATE ')) {
      return await this.createInstance(trimmed);
    }
    if (upperCommand.startsWith('START ')) {
      return await this.startInstance(trimmed.substring(6).trim());
    }
    if (upperCommand.startsWith('STOP ')) {
      return await this.stopInstance(trimmed.substring(5).trim());
    }
    if (upperCommand.startsWith('DELETE INSTANCE ') || upperCommand.startsWith('DELETE ')) {
      return await this.deleteInstance(trimmed);
    }
    if (upperCommand.startsWith('LIST') || upperCommand === '') {
      return await this.listInstances(trimmed);
    }
    if (upperCommand.startsWith('DESCRIBE ') || upperCommand.startsWith('GET ')) {
      return await this.describeInstance(trimmed);
    }
    if (upperCommand.startsWith('RESET ')) {
      return await this.resetInstance(trimmed.substring(6).trim());
    }

    // Instance templates and groups
    if (upperCommand.startsWith('CREATE TEMPLATE ')) {
      return await this.createTemplate(trimmed.substring(16).trim());
    }
    if (upperCommand.startsWith('CREATE INSTANCE-GROUP ')) {
      return await this.createInstanceGroup(trimmed.substring(22).trim());
    }
    if (upperCommand.startsWith('AUTOSCALE ')) {
      return await this.autoscale(trimmed.substring(10).trim());
    }

    throw new Error(`Unknown COMPUTE command: ${trimmed.split(' ')[0]}`);
  }

  async createInstance(command) {
    // Parse: CREATE [INSTANCE] name [MACHINE type] [ZONE zone] [IMAGE image] [params...]
    const params = parseKeyValueParams(command);

    // Extract positional arguments for name (first word after CREATE/CREATE INSTANCE)
    const parts = command.trim().split(/\s+/);
    let nameIdx = parts[0].toUpperCase() === 'CREATE' ? (parts[1].toUpperCase() === 'INSTANCE' ? 2 : 1) : 0;
    const instanceName = params.name || parts[nameIdx];

    const machineType = params.machine || params.type || 'e2-micro';
    const zone = params.zone || 'us-central1-a';
    const image = params.image || 'debian-11';
    const diskSize = params.disk || '10';

    const cmdParts = [
      'gcloud', 'compute', 'instances', 'create', instanceName,
      '--machine-type', machineType,
      '--zone', zone,
      '--boot-disk-size', diskSize + 'GB',
      '--format', 'json'
    ];

    // Handle image (can be family or specific image)
    if (image.includes('/')) {
      cmdParts.push('--image', image);
    } else if (image.startsWith('debian') || image.startsWith('ubuntu') || image.startsWith('centos')) {
      cmdParts.push('--image-family', image);
      if (image.startsWith('debian')) {
        cmdParts.push('--image-project', 'debian-cloud');
      } else if (image.startsWith('ubuntu')) {
        cmdParts.push('--image-project', 'ubuntu-os-cloud');
      } else if (image.startsWith('centos')) {
        cmdParts.push('--image-project', 'centos-cloud');
      }
    } else {
      cmdParts.push('--image', image);
    }

    // Add optional parameters
    if (params.preemptible === 'true') {
      cmdParts.push('--preemptible');
    }
    if (params.tags) {
      cmdParts.push('--tags', params.tags);
    }
    if (params.labels) {
      cmdParts.push('--labels', params.labels);
    }
    if (params.network) {
      cmdParts.push('--network', params.network);
    }
    if (params.subnet) {
      cmdParts.push('--subnet', params.subnet);
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let instanceData = null;
      try {
        const parsed = JSON.parse(result.stdout);
        instanceData = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        // JSON parsing failed, use text output
      }

      return {
        success: true,
        action: 'created',
        instance: instanceName,
        zone: zone,
        machineType: machineType,
        image: image,
        data: instanceData,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create instance: ${result.stderr || result.stdout}`);
  }

  async startInstance(params) {
    // Parse: instance-name [zone=us-central1-a]
    const parsed = parseKeyValueParams(params);
    const parts = params.trim().split(/\s+/);
    const instanceName = parsed.instance || parts[0];
    const zone = parsed.zone || 'us-central1-a';

    const result = await this.executeGcloud([
      'gcloud', 'compute', 'instances', 'start', instanceName,
      '--zone', zone,
      '--format', 'json'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'started',
        instance: instanceName,
        zone: zone,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to start instance: ${result.stderr || result.stdout}`);
  }

  async stopInstance(params) {
    // Parse: instance-name [zone=us-central1-a]
    const parsed = parseKeyValueParams(params);
    const parts = params.trim().split(/\s+/);
    const instanceName = parsed.instance || parts[0];
    const zone = parsed.zone || 'us-central1-a';

    const result = await this.executeGcloud([
      'gcloud', 'compute', 'instances', 'stop', instanceName,
      '--zone', zone,
      '--format', 'json'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'stopped',
        instance: instanceName,
        zone: zone,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to stop instance: ${result.stderr || result.stdout}`);
  }

  async deleteInstance(command) {
    // Parse: DELETE [INSTANCE] name [zone=us-central1-a]
    const params = parseKeyValueParams(command);
    const parts = command.trim().split(/\s+/);
    let nameIdx = parts[0].toUpperCase() === 'DELETE' ? (parts[1].toUpperCase() === 'INSTANCE' ? 2 : 1) : 0;
    const instanceName = params.instance || params.name || parts[nameIdx];
    const zone = params.zone || 'us-central1-a';

    const result = await this.executeGcloud([
      'gcloud', 'compute', 'instances', 'delete', instanceName,
      '--zone', zone,
      '--quiet', // Skip confirmation
      '--format', 'json'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        instance: instanceName,
        zone: zone,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete instance: ${result.stderr || result.stdout}`);
  }

  async listInstances(command) {
    // Parse: LIST [zone=zone] [filter="filter"]
    const params = parseKeyValueParams(command);
    const cmdParts = ['gcloud', 'compute', 'instances', 'list', '--format', 'json'];

    if (params.zone) {
      cmdParts.push('--zones', params.zone);
    }
    if (params.filter) {
      cmdParts.push('--filter', params.filter);
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let instances = [];
      try {
        instances = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'list',
        instances: instances,
        count: instances.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list instances: ${result.stderr || result.stdout}`);
  }

  async describeInstance(command) {
    // Parse: DESCRIBE instance-name [zone=us-central1-a] or GET instance-name [zone=us-central1-a]
    const params = parseKeyValueParams(command);
    const parts = command.trim().split(/\s+/);
    const instanceName = params.instance || params.name || parts[1];
    const zone = params.zone || 'us-central1-a';

    const result = await this.executeGcloud([
      'gcloud', 'compute', 'instances', 'describe', instanceName,
      '--zone', zone,
      '--format', 'json'
    ]);

    if (result.success) {
      let instanceData = null;
      try {
        instanceData = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'describe',
        instance: instanceName,
        zone: zone,
        data: instanceData,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to describe instance: ${result.stderr || result.stdout}`);
  }

  async resetInstance(params) {
    // Parse: instance-name [zone=us-central1-a]
    const parsed = parseKeyValueParams(params);
    const parts = params.trim().split(/\s+/);
    const instanceName = parsed.instance || parts[0];
    const zone = parsed.zone || 'us-central1-a';

    const result = await this.executeGcloud([
      'gcloud', 'compute', 'instances', 'reset', instanceName,
      '--zone', zone,
      '--format', 'json'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'reset',
        instance: instanceName,
        zone: zone,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to reset instance: ${result.stderr || result.stdout}`);
  }

  async createTemplate(params) {
    // Simplified implementation for instance templates
    throw new Error('Instance templates not yet implemented. Use CREATE INSTANCE for basic VMs.');
  }

  async createInstanceGroup(params) {
    // Simplified implementation for instance groups
    throw new Error('Instance groups not yet implemented. Use CREATE INSTANCE for basic VMs.');
  }

  async autoscale(params) {
    // Simplified implementation for autoscaling
    throw new Error('Autoscaling not yet implemented. Use CREATE INSTANCE for basic VMs.');
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

module.exports = ComputeEngineHandler;
