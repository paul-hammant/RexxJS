/* Secret Manager Handler - Secure secret storage */

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}

const { spawn } = require('child_process');

class SecretManagerHandler {
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

    // Secret operations
    if (upperCommand.startsWith('CREATE ')) {
      return await this.createSecret(trimmed.substring(7).trim());
    }
    if (upperCommand.startsWith('DELETE ')) {
      return await this.deleteSecret(trimmed.substring(7).trim());
    }
    if (upperCommand.startsWith('LIST') || upperCommand === '') {
      return await this.listSecrets();
    }

    // Version operations
    if (upperCommand.startsWith('ADD-VERSION ') || upperCommand.startsWith('ADD VERSION ')) {
      return await this.addVersion(trimmed);
    }
    if (upperCommand.startsWith('ACCESS ')) {
      return await this.accessSecret(trimmed.substring(7).trim());
    }
    if (upperCommand.startsWith('LIST VERSIONS ')) {
      return await this.listVersions(trimmed.substring(14).trim());
    }
    if (upperCommand.startsWith('DESTROY VERSION ')) {
      return await this.destroyVersion(trimmed.substring(16).trim());
    }

    throw new Error(`Unknown SECRET command: ${trimmed.split(' ')[0]}`);
  }

  async createSecret(params) {
    // Parse: name [replication=automatic] [labels=env=prod]
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const secretName = parsed.name || parts[0];
    const replication = parsed.replication || 'automatic';

    const cmdParts = [
      'gcloud', 'secrets', 'create', secretName,
      '--replication-policy', replication
    ];

    if (parsed.labels) {
      cmdParts.push('--labels', parsed.labels);
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      return {
        success: true,
        action: 'created',
        secret: secretName,
        replication: replication,
        note: 'Secret created. Add a version with ADD-VERSION to store actual secret data.',
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create secret: ${result.stderr || result.stdout}`);
  }

  async deleteSecret(params) {
    const parts = params.split(/\s+/);
    const secretName = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'secrets', 'delete', secretName,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        secret: secretName,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete secret: ${result.stderr || result.stdout}`);
  }

  async listSecrets() {
    const result = await this.executeGcloud([
      'gcloud', 'secrets', 'list',
      '--format', 'json'
    ]);

    if (result.success) {
      let secrets = [];
      try {
        secrets = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        secrets: secrets,
        count: secrets.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list secrets: ${result.stderr || result.stdout}`);
  }

  async addVersion(command) {
    // Parse: ADD-VERSION secret data="secret-value" or data-file=path
    const params = command.substring(command.toUpperCase().indexOf('VERSION') + 7).trim();
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const secretName = parsed.secret || parts[0];
    const data = parsed.data;
    const dataFile = parsed['data-file'] || parsed.file;

    if (!secretName || (!data && !dataFile)) {
      throw new Error('SECRET and (DATA or DATA-FILE) required. Usage: ADD-VERSION secret data="my-secret-value"');
    }

    const cmdParts = ['gcloud', 'secrets', 'versions', 'add', secretName];

    if (data) {
      // Pass data via stdin using echo
      const result = await this.executeGcloudWithInput(cmdParts.concat('--data-file', '-'), data);

      if (result.success) {
        return {
          success: true,
          action: 'version_added',
          secret: secretName,
          note: 'New version created with provided data',
          stdout: result.stdout,
          stderr: result.stderr
        };
      }

      throw new Error(`Failed to add secret version: ${result.stderr || result.stdout}`);
    } else {
      // Use data from file
      cmdParts.push('--data-file', dataFile);

      const result = await this.executeGcloud(cmdParts);

      if (result.success) {
        return {
          success: true,
          action: 'version_added',
          secret: secretName,
          dataFile: dataFile,
          stdout: result.stdout,
          stderr: result.stderr
        };
      }

      throw new Error(`Failed to add secret version from file: ${result.stderr || result.stdout}`);
    }
  }

  async accessSecret(params) {
    // Parse: secret [version=latest]
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const secretName = parsed.secret || parts[0];
    const version = parsed.version || 'latest';

    const result = await this.executeGcloud([
      'gcloud', 'secrets', 'versions', 'access', version,
      '--secret', secretName
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'accessed',
        secret: secretName,
        version: version,
        value: result.stdout,
        warning: 'Secret value exposed in stdout - handle securely',
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to access secret: ${result.stderr || result.stdout}`);
  }

  async listVersions(params) {
    const parts = params.split(/\s+/);
    const secretName = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'secrets', 'versions', 'list', secretName,
      '--format', 'json'
    ]);

    if (result.success) {
      let versions = [];
      try {
        versions = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        secret: secretName,
        versions: versions,
        count: versions.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list secret versions: ${result.stderr || result.stdout}`);
  }

  async destroyVersion(params) {
    // Parse: secret version=1
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const secretName = parsed.secret || parts[0];
    const version = parsed.version;

    if (!version) {
      throw new Error('VERSION required. Usage: DESTROY VERSION secret version=1');
    }

    const result = await this.executeGcloud([
      'gcloud', 'secrets', 'versions', 'destroy', version,
      '--secret', secretName,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'destroyed',
        secret: secretName,
        version: version,
        note: 'Version destroyed - data is permanently deleted',
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to destroy secret version: ${result.stderr || result.stdout}`);
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

  async executeGcloudWithInput(cmdParts, input) {
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

      // Write input to stdin
      process.stdin.write(input);
      process.stdin.end();

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

module.exports = SecretManagerHandler;
