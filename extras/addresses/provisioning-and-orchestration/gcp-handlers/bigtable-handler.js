/* Cloud Bigtable Handler - NoSQL wide-column database */

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class CloudBigtableHandler {
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

    // Clusters
    if (upperCommand.startsWith('CREATE CLUSTER')) {
      return await this.createCluster(command);
    }
    if (upperCommand.startsWith('DELETE CLUSTER')) {
      return await this.deleteCluster(command);
    }
    if (upperCommand.startsWith('LIST CLUSTERS')) {
      return await this.listClusters(command);
    }
    if (upperCommand.startsWith('UPDATE CLUSTER')) {
      return await this.updateCluster(command);
    }

    // Tables
    if (upperCommand.startsWith('CREATE TABLE')) {
      return await this.createTable(command);
    }
    if (upperCommand.startsWith('DELETE TABLE')) {
      return await this.deleteTable(command);
    }
    if (upperCommand.startsWith('LIST TABLES')) {
      return await this.listTables(command);
    }

    // Column families
    if (upperCommand.startsWith('CREATE COLUMN-FAMILY')) {
      return await this.createColumnFamily(command);
    }
    if (upperCommand.startsWith('DELETE COLUMN-FAMILY')) {
      return await this.deleteColumnFamily(command);
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

    throw new Error('Unknown Cloud Bigtable command: ' + command);
  }

  async createInstance(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['bigtable', 'instances', 'create', name];

    if (params['display-name']) {
      args.push('--display-name', params['display-name']);
    }

    // Cluster configuration
    if (params.cluster) {
      args.push('--cluster', params.cluster);
    }

    if (params['cluster-zone']) {
      args.push('--cluster-zone', params['cluster-zone']);
    }

    if (params['cluster-num-nodes']) {
      args.push('--cluster-num-nodes', params['cluster-num-nodes']);
    }

    if (params['cluster-storage-type']) {
      args.push('--cluster-storage-type', params['cluster-storage-type']); // ssd or hdd
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_instance',
      data: { name },
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

    const args = ['bigtable', 'instances', 'delete', name, '--quiet'];

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
    const args = ['bigtable', 'instances', 'list', '--format', 'json'];
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

    const args = ['bigtable', 'instances', 'describe', name, '--format', 'json'];
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

    const args = ['bigtable', 'instances', 'update', name];

    if (params['display-name']) {
      args.push('--display-name', params['display-name']);
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

  async createCluster(command) {
    const params = parseKeyValueParams(command);
    const cluster = params.cluster;
    const instance = params.instance;
    const zone = params.zone;

    if (!cluster || !instance || !zone) {
      throw new Error('Cluster name, instance name, and zone are required');
    }

    const args = ['bigtable', 'clusters', 'create', cluster];
    args.push('--instance', instance);
    args.push('--zone', zone);

    if (params['num-nodes']) {
      args.push('--num-nodes', params['num-nodes']);
    }

    if (params['storage-type']) {
      args.push('--storage-type', params['storage-type']);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_cluster',
      data: { cluster, instance, zone },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteCluster(command) {
    const params = parseKeyValueParams(command);
    const cluster = params.cluster;
    const instance = params.instance;

    if (!cluster || !instance) {
      throw new Error('Cluster name and instance name are required');
    }

    const args = ['bigtable', 'clusters', 'delete', cluster];
    args.push('--instance', instance);
    args.push('--quiet');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_cluster',
      data: { cluster, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listClusters(command) {
    const params = parseKeyValueParams(command);
    const instance = params.instance;

    if (!instance) {
      throw new Error('Instance name is required');
    }

    const args = ['bigtable', 'clusters', 'list'];
    args.push('--instances', instance);
    args.push('--format', 'json');

    const result = await this.executeGcloud(args);

    let clusters = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        clusters = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_clusters',
      data: { instance, clusters, count: clusters.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async updateCluster(command) {
    const params = parseKeyValueParams(command);
    const cluster = params.cluster;
    const instance = params.instance;

    if (!cluster || !instance) {
      throw new Error('Cluster name and instance name are required');
    }

    const args = ['bigtable', 'clusters', 'update', cluster];
    args.push('--instance', instance);

    if (params['num-nodes']) {
      args.push('--num-nodes', params['num-nodes']);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'update_cluster',
      data: { cluster, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createTable(command) {
    const params = parseKeyValueParams(command);
    const table = params.table;
    const instance = params.instance;

    if (!table || !instance) {
      throw new Error('Table name and instance name are required');
    }

    const args = ['bigtable', 'tables', 'create', table];
    args.push('--instance', instance);

    if (params['column-families']) {
      args.push('--column-families', params['column-families']);
    }

    if (params.splits) {
      args.push('--splits', params.splits);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_table',
      data: { table, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteTable(command) {
    const params = parseKeyValueParams(command);
    const table = params.table;
    const instance = params.instance;

    if (!table || !instance) {
      throw new Error('Table name and instance name are required');
    }

    const args = ['bigtable', 'tables', 'delete', table];
    args.push('--instance', instance);
    args.push('--quiet');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_table',
      data: { table, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listTables(command) {
    const params = parseKeyValueParams(command);
    const instance = params.instance;

    if (!instance) {
      throw new Error('Instance name is required');
    }

    const args = ['bigtable', 'tables', 'list'];
    args.push('--instances', instance);
    args.push('--format', 'json');

    const result = await this.executeGcloud(args);

    let tables = [];
    if (result.exitCode === 0 && result.stdout) {
      try {
        tables = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback to raw output
      }
    }

    return {
      success: result.exitCode === 0,
      action: 'list_tables',
      data: { instance, tables, count: tables.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createColumnFamily(command) {
    const params = parseKeyValueParams(command);
    const family = params.family;
    const table = params.table;
    const instance = params.instance;

    if (!family || !table || !instance) {
      throw new Error('Column family name, table name, and instance name are required');
    }

    const args = ['bigtable', 'column-families', 'create', family];
    args.push('--table', table);
    args.push('--instance', instance);

    if (params['max-age']) {
      args.push('--max-age', params['max-age']);
    }

    if (params['max-versions']) {
      args.push('--max-versions', params['max-versions']);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_column_family',
      data: { family, table, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteColumnFamily(command) {
    const params = parseKeyValueParams(command);
    const family = params.family;
    const table = params.table;
    const instance = params.instance;

    if (!family || !table || !instance) {
      throw new Error('Column family name, table name, and instance name are required');
    }

    const args = ['bigtable', 'column-families', 'delete', family];
    args.push('--table', table);
    args.push('--instance', instance);
    args.push('--quiet');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_column_family',
      data: { family, table, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createBackup(command) {
    const params = parseKeyValueParams(command);
    const backup = params.backup;
    const cluster = params.cluster;
    const instance = params.instance;
    const table = params.table;

    if (!backup || !cluster || !instance || !table) {
      throw new Error('Backup name, cluster, instance, and table are required');
    }

    const args = ['bigtable', 'backups', 'create', backup];
    args.push('--instance', instance);
    args.push('--cluster', cluster);
    args.push('--table', table);

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
      data: { backup, cluster, instance, table },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteBackup(command) {
    const params = parseKeyValueParams(command);
    const backup = params.backup;
    const cluster = params.cluster;
    const instance = params.instance;

    if (!backup || !cluster || !instance) {
      throw new Error('Backup name, cluster, and instance are required');
    }

    const args = ['bigtable', 'backups', 'delete', backup];
    args.push('--instance', instance);
    args.push('--cluster', cluster);
    args.push('--quiet');

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_backup',
      data: { backup, cluster, instance },
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

    const args = ['bigtable', 'backups', 'list'];
    args.push('--instances', instance);
    args.push('--format', 'json');

    if (params.cluster) {
      args.push('--clusters', params.cluster);
    }

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
    const sourceCluster = params['source-cluster'];
    const destinationTable = params['destination-table'];
    const destinationInstance = params['destination-instance'];

    if (!backup || !sourceInstance || !sourceCluster || !destinationTable || !destinationInstance) {
      throw new Error('Backup, source instance, source cluster, destination table, and destination instance are required');
    }

    const args = ['bigtable', 'backups', 'restore', backup];
    args.push('--source-instance', sourceInstance);
    args.push('--source-cluster', sourceCluster);
    args.push('--destination-table', destinationTable);
    args.push('--destination-instance', destinationInstance);

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'restore_backup',
      data: { backup, sourceInstance, destinationTable, destinationInstance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      service: 'bigtable',
      description: 'Cloud Bigtable - NoSQL wide-column database for large-scale workloads',
      commands: {
        'Create instance': 'BIGTABLE CREATE INSTANCE name=my-instance cluster=my-cluster cluster-zone=us-central1-a cluster-num-nodes=3',
        'List instances': 'BIGTABLE LIST INSTANCES',
        'Create table': 'BIGTABLE CREATE TABLE table=my-table instance=my-instance column-families=cf1',
        'Create column family': 'BIGTABLE CREATE COLUMN-FAMILY family=cf2 table=my-table instance=my-instance',
        'Create backup': 'BIGTABLE CREATE BACKUP backup=my-backup instance=my-instance cluster=my-cluster table=my-table',
        'List backups': 'BIGTABLE LIST BACKUPS instance=my-instance',
        'Restore backup': 'BIGTABLE RESTORE backup=my-backup source-instance=my-instance source-cluster=my-cluster destination-table=restored-table destination-instance=my-instance'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = CloudBigtableHandler;
