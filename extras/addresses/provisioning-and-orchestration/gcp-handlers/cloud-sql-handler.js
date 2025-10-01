// ============================================
// Cloud SQL Handler
// ============================================

const { spawn } = require('child_process');
const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class CloudSQLHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async handle(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    if (upperCommand.startsWith('CREATE INSTANCE ') || upperCommand.startsWith('CREATE ')) {
      return await this.createInstance(trimmed);
    }
    if (upperCommand.startsWith('DELETE INSTANCE ') || upperCommand.startsWith('DELETE ')) {
      return await this.deleteInstance(trimmed);
    }
    if (upperCommand.startsWith('LIST') || upperCommand === '') {
      return await this.listInstances();
    }
    if (upperCommand.startsWith('DESCRIBE ') || upperCommand.startsWith('GET ')) {
      return await this.describeInstance(trimmed);
    }
    if (upperCommand.startsWith('CREATE DATABASE ')) {
      return await this.createDatabase(trimmed.substring(16).trim());
    }
    if (upperCommand.startsWith('CREATE USER ')) {
      return await this.createUser(trimmed.substring(12).trim());
    }
    if (upperCommand.startsWith('BACKUP ')) {
      return await this.createBackup(trimmed.substring(7).trim());
    }
    if (upperCommand.startsWith('LIST BACKUPS ')) {
      return await this.listBackups(trimmed.substring(13).trim());
    }

    throw new Error(`Unknown SQL command: ${trimmed.split(' ')[0]}`);
  }

  async createInstance(command) {
    // Parse: CREATE [INSTANCE] name [tier=db-f1-micro] [database=postgres|mysql] [version=...] [region=...]
    const params = parseKeyValueParams(command);
    const parts = command.split(/\s+/);
    let nameIdx = parts[0].toUpperCase() === 'CREATE' ? (parts[1].toUpperCase() === 'INSTANCE' ? 2 : 1) : 0;
    const instanceName = params.name || parts[nameIdx];

    const tier = params.tier || 'db-f1-micro';
    const database = params.database || params.db || 'postgres';
    const version = params.version || (database === 'mysql' ? 'MYSQL_8_0' : 'POSTGRES_15');
    const region = params.region || 'us-central1';

    const cmdParts = [
      'gcloud', 'sql', 'instances', 'create', instanceName,
      '--tier', tier,
      '--database-version', version,
      '--region', region,
      '--format', 'json'
    ];

    // Add optional parameters
    if (params.storage) {
      cmdParts.push('--storage-size', params.storage);
    }
    if (params.labels) {
      cmdParts.push('--labels', params.labels);
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let instanceData = null;
      try {
        const parsed = JSON.parse(result.stdout);
        instanceData = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'created',
        instance: instanceName,
        tier: tier,
        version: version,
        region: region,
        data: instanceData,
        note: 'Cloud SQL instance creation takes several minutes',
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create Cloud SQL instance: ${result.stderr || result.stdout}`);
  }

  async deleteInstance(command) {
    const params = parseKeyValueParams(command);
    const parts = command.split(/\s+/);
    let nameIdx = parts[0].toUpperCase() === 'DELETE' ? (parts[1].toUpperCase() === 'INSTANCE' ? 2 : 1) : 0;
    const instanceName = params.instance || params.name || parts[nameIdx];

    const result = await this.executeGcloud([
      'gcloud', 'sql', 'instances', 'delete', instanceName,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        instance: instanceName,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete Cloud SQL instance: ${result.stderr || result.stdout}`);
  }

  async listInstances() {
    const result = await this.executeGcloud([
      'gcloud', 'sql', 'instances', 'list',
      '--format', 'json'
    ]);

    if (result.success) {
      let instances = [];
      try {
        instances = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        instances: instances,
        count: instances.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list Cloud SQL instances: ${result.stderr || result.stdout}`);
  }

  async describeInstance(command) {
    const params = parseKeyValueParams(command);
    const parts = command.split(/\s+/);
    const instanceName = params.instance || params.name || parts[1];

    const result = await this.executeGcloud([
      'gcloud', 'sql', 'instances', 'describe', instanceName,
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
        instance: instanceName,
        data: instanceData,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to describe Cloud SQL instance: ${result.stderr || result.stdout}`);
  }

  async createDatabase(params) {
    // Parse: instance=name database=dbname
    const parsed = parseKeyValueParams(params);
    const instance = parsed.instance;
    const database = parsed.database || parsed.name;

    if (!instance || !database) {
      throw new Error('INSTANCE and DATABASE required. Usage: CREATE DATABASE instance=myinstance database=mydb');
    }

    const result = await this.executeGcloud([
      'gcloud', 'sql', 'databases', 'create', database,
      '--instance', instance
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'created',
        database: database,
        instance: instance,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create database: ${result.stderr || result.stdout}`);
  }

  async createUser(params) {
    // Parse: instance=name user=username password=...
    const parsed = parseKeyValueParams(params);
    const instance = parsed.instance;
    const user = parsed.user || parsed.name;
    const password = parsed.password;

    if (!instance || !user || !password) {
      throw new Error('INSTANCE, USER, and PASSWORD required. Usage: CREATE USER instance=myinstance user=myuser password=secret');
    }

    const result = await this.executeGcloud([
      'gcloud', 'sql', 'users', 'create', user,
      '--instance', instance,
      '--password', password
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'created',
        user: user,
        instance: instance,
        warning: 'Password is set. Store it securely.',
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create user: ${result.stderr || result.stdout}`);
  }

  async createBackup(params) {
    // Parse: instance=name [description="..."]
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const instance = parsed.instance || parts[0];
    const description = parsed.description || 'Manual backup from RexxJS';

    const result = await this.executeGcloud([
      'gcloud', 'sql', 'backups', 'create',
      '--instance', instance,
      '--description', description
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'created',
        instance: instance,
        description: description,
        note: 'Backup creation may take several minutes',
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create backup: ${result.stderr || result.stdout}`);
  }

  async listBackups(params) {
    const parts = params.split(/\s+/);
    const instance = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'sql', 'backups', 'list',
      '--instance', instance,
      '--format', 'json'
    ]);

    if (result.success) {
      let backups = [];
      try {
        backups = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        instance: instance,
        backups: backups,
        count: backups.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list backups: ${result.stderr || result.stdout}`);
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

module.exports = CloudSQLHandler;
