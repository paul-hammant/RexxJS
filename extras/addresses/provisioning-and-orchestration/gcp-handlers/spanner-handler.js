/* Cloud Spanner Handler - Globally distributed relational database */

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class CloudSpannerHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async initialize() {
    // No special initialization needed
  }

  async handle(command) {
    const upperCommand = command.toUpperCase().trim();

    // Instances
    if (upperCommand.startsWith('CREATE INSTANCE')) {
      return await this.createInstance(command);
    }
    if (upperCommand.startsWith('DELETE INSTANCE')) {
      return await this.deleteInstance(command);
    }
    if (upperCommand.startsWith('LIST INSTANCES')) {
      return await this.listInstances(command);
    }
    if (upperCommand.startsWith('DESCRIBE INSTANCE')) {
      return await this.describeInstance(command);
    }
    if (upperCommand.startsWith('UPDATE INSTANCE')) {
      return await this.updateInstance(command);
    }

    // Databases
    if (upperCommand.startsWith('CREATE DATABASE')) {
      return await this.createDatabase(command);
    }
    if (upperCommand.startsWith('DELETE DATABASE')) {
      return await this.deleteDatabase(command);
    }
    if (upperCommand.startsWith('LIST DATABASES')) {
      return await this.listDatabases(command);
    }
    if (upperCommand.startsWith('DESCRIBE DATABASE')) {
      return await this.describeDatabase(command);
    }

    // DDL operations
    if (upperCommand.startsWith('DDL')) {
      return await this.executeDdl(command);
    }

    // Backups
    if (upperCommand.startsWith('CREATE BACKUP')) {
      return await this.createBackup(command);
    }
    if (upperCommand.startsWith('DELETE BACKUP')) {
      return await this.deleteBackup(command);
    }
    if (upperCommand.startsWith('LIST BACKUPS')) {
      return await this.listBackups(command);
    }
    if (upperCommand.startsWith('RESTORE')) {
      return await this.restoreBackup(command);
    }

    // Query
    if (upperCommand.startsWith('QUERY')) {
      return await this.executeQuery(command);
    }

    throw new Error('Unknown Cloud Spanner command: ' + command);
  }

  async createInstance(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const config = params.config;

    if (!name || !config) {
      throw new Error('Instance name and config are required');
    }

    const args = ['spanner', 'instances', 'create', name];
    args.push('--config', config);

    if (params['display-name']) {
      args.push('--display-name', params['display-name']);
    }

    if (params.nodes) {
      args.push('--nodes', params.nodes);
    }

    if (params['processing-units']) {
      args.push('--processing-units', params['processing-units']);
    }

    if (params.description) {
      args.push('--description', params.description);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_instance',
      data: { name, config },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteInstance(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['spanner', 'instances', 'delete', name, '--quiet'];
    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_instance',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listInstances(command) {
    const args = ['spanner', 'instances', 'list', '--format', 'json'];
    const result = await this.executeGcloud(args);

    let instances = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        instances = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_instances',
      data: { instances, count: instances.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeInstance(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['spanner', 'instances', 'describe', name, '--format', 'json'];
    const result = await this.executeGcloud(args);

    let instance = null;
    if (result.exitCode === 0 && result.stdout) {
      try {
        instance = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'describe_instance',
      data: { name, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async updateInstance(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['spanner', 'instances', 'update', name];

    if (params.nodes) {
      args.push('--nodes', params.nodes);
    }

    if (params['processing-units']) {
      args.push('--processing-units', params['processing-units']);
    }

    if (params.description) {
      args.push('--description', params.description);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'update_instance',
      data: { name },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createDatabase(command) {
    const params = parseKeyValueParams(command);
    const database = params.database;
    const instance = params.instance;

    if (!database || !instance) {
      throw new Error('Database name and instance name are required');
    }

    const args = ['spanner', 'databases', 'create', database];
    args.push('--instance', instance);

    if (params.ddl) {
      args.push('--ddl', params.ddl);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_database',
      data: { database, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteDatabase(command) {
    const params = parseKeyValueParams(command);
    const database = params.database;
    const instance = params.instance;

    if (!database || !instance) {
      throw new Error('Database name and instance name are required');
    }

    const args = ['spanner', 'databases', 'delete', database];
    args.push('--instance', instance);
    args.push('--quiet');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_database',
      data: { database, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listDatabases(command) {
    const params = parseKeyValueParams(command);
    const instance = params.instance;

    if (!instance) {
      throw new Error('Instance name is required');
    }

    const args = ['spanner', 'databases', 'list'];
    args.push('--instance', instance);
    args.push('--format', 'json');

    const result = await this.executeGcloud(args);

    let databases = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        databases = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_databases',
      data: { instance, databases, count: databases.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeDatabase(command) {
    const params = parseKeyValueParams(command);
    const database = params.database;
    const instance = params.instance;

    if (!database || !instance) {
      throw new Error('Database name and instance name are required');
    }

    const args = ['spanner', 'databases', 'describe', database];
    args.push('--instance', instance);
    args.push('--format', 'json');

    const result = await this.executeGcloud(args);

    let db = null;
    if (result.exitCode === 0 && result.stdout) {
      try {
        db = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'describe_database',
      data: { database, instance, db },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async executeDdl(command) {
    const params = parseKeyValueParams(command);
    const database = params.database;
    const instance = params.instance;
    const ddl = params.ddl;

    if (!database || !instance || !ddl) {
      throw new Error('Database name, instance name, and DDL statement are required');
    }

    const args = ['spanner', 'databases', 'ddl', 'update', database];
    args.push('--instance', instance);
    args.push('--ddl', ddl);

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'execute_ddl',
      data: { database, instance, ddl },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createBackup(command) {
    const params = parseKeyValueParams(command);
    const backup = params.backup;
    const instance = params.instance;
    const database = params.database;

    if (!backup || !instance || !database) {
      throw new Error('Backup name, instance name, and database name are required');
    }

    const args = ['spanner', 'backups', 'create', backup];
    args.push('--instance', instance);
    args.push('--database', database);

    if (params['retention-period']) {
      args.push('--retention-period', params['retention-period']);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_backup',
      data: { backup, instance, database },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteBackup(command) {
    const params = parseKeyValueParams(command);
    const backup = params.backup;
    const instance = params.instance;

    if (!backup || !instance) {
      throw new Error('Backup name and instance name are required');
    }

    const args = ['spanner', 'backups', 'delete', backup];
    args.push('--instance', instance);
    args.push('--quiet');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_backup',
      data: { backup, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listBackups(command) {
    const params = parseKeyValueParams(command);
    const instance = params.instance;

    if (!instance) {
      throw new Error('Instance name is required');
    }

    const args = ['spanner', 'backups', 'list'];
    args.push('--instance', instance);
    args.push('--format', 'json');

    const result = await this.executeGcloud(args);

    let backups = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        backups = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_backups',
      data: { instance, backups, count: backups.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async restoreBackup(command) {
    const params = parseKeyValueParams(command);
    const backup = params.backup;
    const sourceInstance = params['source-instance'];
    const destinationDatabase = params['destination-database'];
    const destinationInstance = params['destination-instance'];

    if (!backup || !sourceInstance || !destinationDatabase || !destinationInstance) {
      throw new Error('Backup, source instance, destination database, and destination instance are required');
    }

    const args = ['spanner', 'backups', 'restore', backup];
    args.push('--source-instance', sourceInstance);
    args.push('--destination-database', destinationDatabase);
    args.push('--destination-instance', destinationInstance);

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'restore_backup',
      data: { backup, sourceInstance, destinationDatabase, destinationInstance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async executeQuery(command) {
    const params = parseKeyValueParams(command);
    const database = params.database;
    const instance = params.instance;
    const sql = params.sql;

    if (!database || !instance || !sql) {
      throw new Error('Database name, instance name, and SQL query are required');
    }

    const args = ['spanner', 'databases', 'execute-sql', database];
    args.push('--instance', instance);
    args.push('--sql', sql);
    args.push('--format', 'json');

    const result = await this.executeGcloud(args);

    let rows = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        const response = JSON.parse(result.stdout);
        rows = response.rows || [];
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'execute_query',
      data: { database, instance, sql, rows, rowCount: rows.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      service: 'spanner',
      description: 'Cloud Spanner - Globally distributed, strongly consistent relational database',
      commands: {
        'Create instance': 'SPANNER CREATE INSTANCE name=my-instance config=regional-us-central1 nodes=1',
        'List instances': 'SPANNER LIST INSTANCES',
        'Create database': 'SPANNER CREATE DATABASE database=my-db instance=my-instance',
        'List databases': 'SPANNER LIST DATABASES instance=my-instance',
        'Execute DDL': 'SPANNER DDL database=my-db instance=my-instance ddl="CREATE TABLE Users (id INT64, name STRING(100)) PRIMARY KEY (id)"',
        'Execute query': 'SPANNER QUERY database=my-db instance=my-instance sql="SELECT * FROM Users"',
        'Create backup': 'SPANNER CREATE BACKUP backup=my-backup instance=my-instance database=my-db retention-period=7d',
        'Restore backup': 'SPANNER RESTORE backup=my-backup source-instance=my-instance destination-database=restored-db destination-instance=my-instance'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = CloudSpannerHandler;
