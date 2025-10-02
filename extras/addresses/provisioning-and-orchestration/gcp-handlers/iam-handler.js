// ============================================
// IAM Handler
// ============================================

const { spawn } = require('child_process');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');

class IAMHandler {
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

    if (upperCommand.startsWith('CREATE SERVICE-ACCOUNT ') || upperCommand.startsWith('CREATE SERVICEACCOUNT ')) {
      return await this.createServiceAccount(trimmed);
    }
    if (upperCommand.startsWith('DELETE SERVICE-ACCOUNT ') || upperCommand.startsWith('DELETE SERVICEACCOUNT ')) {
      return await this.deleteServiceAccount(trimmed);
    }
    if (upperCommand.startsWith('LIST SERVICE-ACCOUNTS') || upperCommand.startsWith('LIST SERVICEACCOUNTS')) {
      return await this.listServiceAccounts();
    }
    if (upperCommand.startsWith('GRANT ')) {
      return await this.grantRole(trimmed.substring(6).trim());
    }
    if (upperCommand.startsWith('REVOKE ')) {
      return await this.revokeRole(trimmed.substring(7).trim());
    }
    if (upperCommand.startsWith('CREATE KEY ')) {
      return await this.createKey(trimmed.substring(11).trim());
    }
    if (upperCommand.startsWith('LIST KEYS ')) {
      return await this.listKeys(trimmed.substring(10).trim());
    }
    if (upperCommand.startsWith('GET-POLICY') || upperCommand.startsWith('GET_POLICY')) {
      return await this.getPolicy(trimmed);
    }

    throw new Error(`Unknown IAM command: ${trimmed.split(' ')[0]}`);
  }

  async createServiceAccount(command) {
    // Parse: CREATE SERVICE-ACCOUNT name [display="Display Name"] [description="..."]
    const params = parseKeyValueParams(command);
    const parts = command.split(/\s+/);
    const accountName = params.name || parts[2] || parts[3]; // Skip CREATE and SERVICE-ACCOUNT
    const displayName = params.display || accountName;
    const description = params.description || 'Created by RexxJS';

    const cmdParts = [
      'gcloud', 'iam', 'service-accounts', 'create', accountName,
      '--display-name', displayName,
      '--description', description,
      '--format', 'json'
    ];

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      const project = this.parent.project;
      const email = `${accountName}@${project}.iam.gserviceaccount.com`;

      return {
        success: true,
        action: 'created',
        account: accountName,
        email: email,
        displayName: displayName,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create service account: ${result.stderr || result.stdout}`);
  }

  async deleteServiceAccount(command) {
    const params = parseKeyValueParams(command);
    const parts = command.split(/\s+/);
    const accountEmail = params.email || params.account || parts[2] || parts[3];

    const result = await this.executeGcloud([
      'gcloud', 'iam', 'service-accounts', 'delete', accountEmail,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        account: accountEmail,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete service account: ${result.stderr || result.stdout}`);
  }

  async listServiceAccounts() {
    const result = await this.executeGcloud([
      'gcloud', 'iam', 'service-accounts', 'list',
      '--format', 'json'
    ]);

    if (result.success) {
      let accounts = [];
      try {
        accounts = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        accounts: accounts,
        count: accounts.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list service accounts: ${result.stderr || result.stdout}`);
  }

  async grantRole(params) {
    // Parse: account role=roles/...
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const account = parsed.account || parsed.member || parts[0];
    const role = parsed.role;

    if (!role) {
      throw new Error('ROLE required. Usage: GRANT account@project.iam.gserviceaccount.com role=roles/viewer');
    }

    const member = account.includes('@') ? `serviceAccount:${account}` : account;
    const project = this.parent.project;

    const result = await this.executeGcloud([
      'gcloud', 'projects', 'add-iam-policy-binding', project,
      '--member', member,
      '--role', role,
      '--format', 'json'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'granted',
        member: account,
        role: role,
        project: project,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to grant role: ${result.stderr || result.stdout}`);
  }

  async revokeRole(params) {
    // Parse: account role=roles/...
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const account = parsed.account || parsed.member || parts[0];
    const role = parsed.role;

    if (!role) {
      throw new Error('ROLE required. Usage: REVOKE account@project.iam.gserviceaccount.com role=roles/viewer');
    }

    const member = account.includes('@') ? `serviceAccount:${account}` : account;
    const project = this.parent.project;

    const result = await this.executeGcloud([
      'gcloud', 'projects', 'remove-iam-policy-binding', project,
      '--member', member,
      '--role', role,
      '--format', 'json'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'revoked',
        member: account,
        role: role,
        project: project,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to revoke role: ${result.stderr || result.stdout}`);
  }

  async createKey(params) {
    // Parse: account [file=path/to/key.json]
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const account = parsed.account || parts[0];
    const keyFile = parsed.file || `${account.split('@')[0]}-key.json`;

    const result = await this.executeGcloud([
      'gcloud', 'iam', 'service-accounts', 'keys', 'create', keyFile,
      '--iam-account', account,
      '--key-file-type', 'json'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'created',
        account: account,
        keyFile: keyFile,
        warning: 'Store this key securely. It cannot be recovered if lost.',
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create key: ${result.stderr || result.stdout}`);
  }

  async listKeys(params) {
    const parts = params.split(/\s+/);
    const account = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'iam', 'service-accounts', 'keys', 'list',
      '--iam-account', account,
      '--format', 'json'
    ]);

    if (result.success) {
      let keys = [];
      try {
        keys = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        account: account,
        keys: keys,
        count: keys.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list keys: ${result.stderr || result.stdout}`);
  }

  async getPolicy(params) {
    const project = this.parent.project;

    const result = await this.executeGcloud([
      'gcloud', 'projects', 'get-iam-policy', project,
      '--format', 'json'
    ]);

    if (result.success) {
      let policy = null;
      try {
        policy = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        project: project,
        policy: policy,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to get IAM policy: ${result.stderr || result.stdout}`);
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

module.exports = IAMHandler;
