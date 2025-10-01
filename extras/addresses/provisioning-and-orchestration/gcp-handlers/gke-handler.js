// ============================================
// GKE (Google Kubernetes Engine) Handler
// ============================================

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class GKEHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async initialize() {
    // GKE operations work via gcloud CLI
  }

  async handle(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    // CREATE CLUSTER name=... [zone=...] [num-nodes=...]
    if (upperCommand.startsWith('CREATE CLUSTER ')) {
      return await this.createCluster(trimmed.substring(15));
    }

    // DELETE CLUSTER name=... [zone=...]
    if (upperCommand.startsWith('DELETE CLUSTER ')) {
      return await this.deleteCluster(trimmed.substring(15));
    }

    // LIST CLUSTERS [zone=...]
    if (upperCommand.startsWith('LIST CLUSTERS')) {
      return await this.listClusters(trimmed.substring(13).trim());
    }

    // DESCRIBE CLUSTER name=... [zone=...]
    if (upperCommand.startsWith('DESCRIBE CLUSTER ')) {
      return await this.describeCluster(trimmed.substring(17));
    }

    // GET CREDENTIALS name=... [zone=...]
    if (upperCommand.startsWith('GET CREDENTIALS ') || upperCommand.startsWith('GET-CREDENTIALS ')) {
      const startPos = upperCommand.startsWith('GET CREDENTIALS ') ? 16 : 16;
      return await this.getCredentials(trimmed.substring(startPos));
    }

    // RESIZE CLUSTER name=... num-nodes=... [zone=...]
    if (upperCommand.startsWith('RESIZE CLUSTER ')) {
      return await this.resizeCluster(trimmed.substring(15));
    }

    // UPGRADE CLUSTER name=... [zone=...] [version=...]
    if (upperCommand.startsWith('UPGRADE CLUSTER ')) {
      return await this.upgradeCluster(trimmed.substring(16));
    }

    // LIST NODE-POOLS cluster=... [zone=...]
    if (upperCommand.startsWith('LIST NODE-POOLS ') || upperCommand.startsWith('LIST NODEPOOLS ')) {
      return await this.listNodePools(trimmed.substring(16));
    }

    // INFO
    if (upperCommand === 'INFO') {
      return this.getInfo();
    }

    throw new Error(`Unknown GKE command: ${trimmed.split(' ')[0]}`);
  }

  async createCluster(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const zone = params.zone || 'us-central1-a';
    const numNodes = params['num-nodes'] || '3';
    const machineType = params['machine-type'] || 'e2-medium';
    const diskSize = params['disk-size'] || '100';

    if (!name) {
      throw new Error('Cluster name required: CREATE CLUSTER name=... zone=... num-nodes=...');
    }

    const args = [
      'container', 'clusters', 'create', name,
      '--zone', zone,
      '--num-nodes', numNodes,
      '--machine-type', machineType,
      '--disk-size', diskSize,
      '--format', 'json'
    ];

    // Add optional autopilot mode
    if (params.autopilot === 'true') {
      args.push('--enable-autopilot');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.success,
      action: 'create_cluster',
      cluster: name,
      zone: zone,
      numNodes: numNodes,
      machineType: machineType,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteCluster(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const zone = params.zone || 'us-central1-a';

    if (!name) {
      throw new Error('Cluster name required: DELETE CLUSTER name=... zone=...');
    }

    const result = await this.executeGcloud([
      'container', 'clusters', 'delete', name,
      '--zone', zone,
      '--quiet',
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'delete_cluster',
      cluster: name,
      zone: zone,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listClusters(command) {
    const params = parseKeyValueParams(command);
    const zone = params.zone; // Optional - list all if not specified

    const args = ['container', 'clusters', 'list', '--format', 'json'];

    if (zone) {
      args.push('--zone', zone);
    }

    const result = await this.executeGcloud(args);

    let clusters = [];
    if (result.success && result.stdout) {
      try {
        clusters = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_clusters',
      zone: zone || 'all',
      clusters: clusters,
      count: clusters.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeCluster(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const zone = params.zone || 'us-central1-a';

    if (!name) {
      throw new Error('Cluster name required: DESCRIBE CLUSTER name=... zone=...');
    }

    const result = await this.executeGcloud([
      'container', 'clusters', 'describe', name,
      '--zone', zone,
      '--format', 'json'
    ]);

    let clusterData = null;
    if (result.success && result.stdout) {
      try {
        clusterData = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'describe_cluster',
      cluster: name,
      zone: zone,
      data: clusterData,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async getCredentials(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const zone = params.zone || 'us-central1-a';

    if (!name) {
      throw new Error('Cluster name required: GET CREDENTIALS name=... zone=...');
    }

    const result = await this.executeGcloud([
      'container', 'clusters', 'get-credentials', name,
      '--zone', zone
    ]);

    return {
      success: result.success,
      action: 'get_credentials',
      cluster: name,
      zone: zone,
      message: 'Kubeconfig updated - you can now use kubectl',
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async resizeCluster(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const numNodes = params['num-nodes'];
    const zone = params.zone || 'us-central1-a';

    if (!name || !numNodes) {
      throw new Error('Cluster name and num-nodes required: RESIZE CLUSTER name=... num-nodes=... zone=...');
    }

    const result = await this.executeGcloud([
      'container', 'clusters', 'resize', name,
      '--num-nodes', numNodes,
      '--zone', zone,
      '--quiet',
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'resize_cluster',
      cluster: name,
      numNodes: numNodes,
      zone: zone,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async upgradeCluster(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const zone = params.zone || 'us-central1-a';
    const version = params.version; // Optional - upgrades to latest if not specified

    if (!name) {
      throw new Error('Cluster name required: UPGRADE CLUSTER name=... zone=... [version=...]');
    }

    const args = [
      'container', 'clusters', 'upgrade', name,
      '--zone', zone,
      '--quiet',
      '--format', 'json'
    ];

    if (version) {
      args.push('--cluster-version', version);
    } else {
      args.push('--master');
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.success,
      action: 'upgrade_cluster',
      cluster: name,
      zone: zone,
      version: version || 'latest',
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listNodePools(command) {
    const params = parseKeyValueParams(command);
    const cluster = params.cluster;
    const zone = params.zone || 'us-central1-a';

    if (!cluster) {
      throw new Error('Cluster name required: LIST NODE-POOLS cluster=... zone=...');
    }

    const result = await this.executeGcloud([
      'container', 'node-pools', 'list',
      '--cluster', cluster,
      '--zone', zone,
      '--format', 'json'
    ]);

    let nodePools = [];
    if (result.success && result.stdout) {
      try {
        nodePools = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_node_pools',
      cluster: cluster,
      zone: zone,
      nodePools: nodePools,
      count: nodePools.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      success: true,
      service: 'GKE (Google Kubernetes Engine)',
      description: 'Managed Kubernetes clusters',
      capabilities: [
        'CREATE CLUSTER - Create a GKE cluster',
        'DELETE CLUSTER - Delete a cluster',
        'LIST CLUSTERS - List all clusters',
        'DESCRIBE CLUSTER - Get cluster details',
        'GET CREDENTIALS - Configure kubectl',
        'RESIZE CLUSTER - Change node count',
        'UPGRADE CLUSTER - Upgrade Kubernetes version',
        'LIST NODE-POOLS - List node pools'
      ],
      examples: {
        'Create cluster': 'GKE CREATE CLUSTER name=my-cluster num-nodes=3 zone=us-central1-a',
        'Get credentials': 'GKE GET CREDENTIALS name=my-cluster zone=us-central1-a',
        'Resize cluster': 'GKE RESIZE CLUSTER name=my-cluster num-nodes=5'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = GKEHandler;
