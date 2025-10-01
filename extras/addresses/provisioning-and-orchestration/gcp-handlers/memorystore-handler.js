// ============================================
// Cloud Memorystore Handler (Redis/Memcached)
// ============================================

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');

class CloudMemorystoreHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async initialize() {
    // No special initialization needed
  }

  async handle(command) {
    const upperCommand = command.toUpperCase().trim();

    // Redis instances
    if (upperCommand.startsWith('CREATE REDIS')) {
      return await this.createRedis(command);
    }
    if (upperCommand.startsWith('DELETE REDIS')) {
      return await this.deleteRedis(command);
    }
    if (upperCommand.startsWith('LIST REDIS')) {
      return await this.listRedis(command);
    }
    if (upperCommand.startsWith('DESCRIBE REDIS')) {
      return await this.describeRedis(command);
    }
    if (upperCommand.startsWith('UPDATE REDIS')) {
      return await this.updateRedis(command);
    }

    // Memcached instances
    if (upperCommand.startsWith('CREATE MEMCACHED')) {
      return await this.createMemcached(command);
    }
    if (upperCommand.startsWith('DELETE MEMCACHED')) {
      return await this.deleteMemcached(command);
    }
    if (upperCommand.startsWith('LIST MEMCACHED')) {
      return await this.listMemcached(command);
    }
    if (upperCommand.startsWith('DESCRIBE MEMCACHED')) {
      return await this.describeMemcached(command);
    }

    // Operations
    if (upperCommand.startsWith('EXPORT')) {
      return await this.exportRedis(command);
    }
    if (upperCommand.startsWith('IMPORT')) {
      return await this.importRedis(command);
    }
    if (upperCommand.startsWith('FAILOVER')) {
      return await this.failover(command);
    }

    throw new Error('Unknown Cloud Memorystore command: ' + command);
  }

  async createRedis(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['redis', 'instances', 'create', name];
    args.push('--region', region);

    if (params.tier) {
      args.push('--tier', params.tier); // basic or standard
    }

    if (params.size) {
      args.push('--size', params.size); // Memory size in GB (1-300)
    }

    if (params['redis-version']) {
      args.push('--redis-version', params['redis-version']); // redis_6_x, redis_7_0, etc.
    }

    if (params.network) {
      args.push('--network', params.network);
    }

    if (params['reserved-ip-range']) {
      args.push('--reserved-ip-range', params['reserved-ip-range']);
    }

    if (params['redis-config']) {
      args.push('--redis-config', params['redis-config']);
    }

    if (params['enable-auth'] === 'true') {
      args.push('--enable-auth');
    }

    if (params['transit-encryption-mode']) {
      args.push('--transit-encryption-mode', params['transit-encryption-mode']);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_redis',
      data: { name, region, tier: params.tier || 'basic' },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteRedis(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['redis', 'instances', 'delete', name];
    args.push('--region', region);
    args.push('--quiet');

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_redis',
      data: { name, region },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listRedis(command) {
    const params = parseKeyValueParams(command);
    const args = ['redis', 'instances', 'list', '--format', 'json'];

    if (params.region) {
      args.push('--region', params.region);
    }

    if (params.filter) {
      args.push('--filter', params.filter);
    }

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
      action: 'list_redis',
      data: { instances, count: instances.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeRedis(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['redis', 'instances', 'describe', name];
    args.push('--region', region);
    args.push('--format', 'json');

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
      action: 'describe_redis',
      data: { name, region, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async updateRedis(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['redis', 'instances', 'update', name];
    args.push('--region', region);

    if (params.size) {
      args.push('--size', params.size);
    }

    if (params['redis-config']) {
      args.push('--update-redis-config', params['redis-config']);
    }

    if (params['remove-redis-config']) {
      args.push('--remove-redis-config', params['remove-redis-config']);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'update_redis',
      data: { name, region },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createMemcached(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['memcache', 'instances', 'create', name];
    args.push('--region', region);

    if (params['node-count']) {
      args.push('--node-count', params['node-count']);
    }

    if (params['node-cpu']) {
      args.push('--node-cpu', params['node-cpu']); // 1 or 2
    }

    if (params['node-memory']) {
      args.push('--node-memory', params['node-memory']); // Memory in MB (1024-6656)
    }

    if (params['memcached-version']) {
      args.push('--memcached-version', params['memcached-version']);
    }

    if (params.network) {
      args.push('--network', params.network);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'create_memcached',
      data: { name, region },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteMemcached(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['memcache', 'instances', 'delete', name];
    args.push('--region', region);
    args.push('--quiet');

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'delete_memcached',
      data: { name, region },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listMemcached(command) {
    const params = parseKeyValueParams(command);
    const args = ['memcache', 'instances', 'list', '--format', 'json'];

    if (params.region) {
      args.push('--region', params.region);
    }

    if (params.filter) {
      args.push('--filter', params.filter);
    }

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
      action: 'list_memcached',
      data: { instances, count: instances.length },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeMemcached(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['memcache', 'instances', 'describe', name];
    args.push('--region', region);
    args.push('--format', 'json');

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
      action: 'describe_memcached',
      data: { name, region, instance },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async exportRedis(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';
    const destination = params.destination;

    if (!name || !destination) {
      throw new Error('Instance name and GCS destination are required');
    }

    const args = ['redis', 'instances', 'export', name];
    args.push('--region', region);
    args.push('--destination', destination);

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'export_redis',
      data: { name, region, destination },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async importRedis(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';
    const source = params.source;

    if (!name || !source) {
      throw new Error('Instance name and GCS source are required');
    }

    const args = ['redis', 'instances', 'import', name];
    args.push('--region', region);
    args.push('--source', source);

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'import_redis',
      data: { name, region, source },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async failover(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const region = params.region || 'us-central1';

    if (!name) {
      throw new Error('Instance name is required');
    }

    const args = ['redis', 'instances', 'failover', name];
    args.push('--region', region);

    if (params['data-protection-mode']) {
      args.push('--data-protection-mode', params['data-protection-mode']);
    }

    if (params.async === 'true') {
      args.push('--async');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.exitCode === 0,
      action: 'failover_redis',
      data: { name, region },
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      service: 'memorystore',
      description: 'Cloud Memorystore - Fully managed Redis and Memcached',
      commands: {
        'Create Redis instance': 'MEMORYSTORE CREATE REDIS name=my-redis tier=basic size=1',
        'List Redis instances': 'MEMORYSTORE LIST REDIS',
        'Describe Redis': 'MEMORYSTORE DESCRIBE REDIS name=my-redis',
        'Update Redis': 'MEMORYSTORE UPDATE REDIS name=my-redis size=2',
        'Delete Redis': 'MEMORYSTORE DELETE REDIS name=my-redis',
        'Create Memcached': 'MEMORYSTORE CREATE MEMCACHED name=my-memcached node-count=2 node-cpu=1 node-memory=1024',
        'Export Redis data': 'MEMORYSTORE EXPORT name=my-redis destination=gs://my-bucket/backup.rdb',
        'Import Redis data': 'MEMORYSTORE IMPORT name=my-redis source=gs://my-bucket/backup.rdb',
        'Failover (HA only)': 'MEMORYSTORE FAILOVER name=my-redis'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = CloudMemorystoreHandler;
