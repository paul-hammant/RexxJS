/* Artifact Registry Handler - Container images and language packages */

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class ArtifactRegistryHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async initialize() {
    // Artifact Registry operations work via gcloud CLI
  }

  async handle(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    if (upperCommand.startsWith('CREATE REPOSITORY ')) {
      return await this.createRepository(trimmed.substring(18));
    }
    if (upperCommand.startsWith('DELETE REPOSITORY ')) {
      return await this.deleteRepository(trimmed.substring(18));
    }
    if (upperCommand.startsWith('LIST REPOSITORIES')) {
      return await this.listRepositories(trimmed.substring(17).trim());
    }
    if (upperCommand.startsWith('LIST IMAGES ')) {
      return await this.listImages(trimmed.substring(12));
    }
    if (upperCommand.startsWith('LIST TAGS ')) {
      return await this.listTags(trimmed.substring(10));
    }
    if (upperCommand.startsWith('DELETE IMAGE ')) {
      return await this.deleteImage(trimmed.substring(13));
    }
    if (upperCommand.startsWith('DESCRIBE REPOSITORY ')) {
      return await this.describeRepository(trimmed.substring(20));
    }
    if (upperCommand === 'INFO') {
      return this.getInfo();
    }

    throw new Error(`Unknown ARTIFACT-REGISTRY command: ${trimmed.split(' ')[0]}`);
  }

  async createRepository(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';
    const format = params.format || 'docker';

    if (!name) {
      throw new Error('Repository name required: CREATE REPOSITORY name=... location=... format=...');
    }

    const result = await this.executeGcloud([
      'artifacts', 'repositories', 'create', name,
      '--repository-format', format,
      '--location', location,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'create_repository',
      repository: name,
      location: location,
      format: format,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteRepository(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Repository name required: DELETE REPOSITORY name=... location=...');
    }

    const result = await this.executeGcloud([
      'artifacts', 'repositories', 'delete', name,
      '--location', location,
      '--quiet',
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'delete_repository',
      repository: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listRepositories(command) {
    const params = parseKeyValueParams(command);
    const location = params.location || 'us-central1';

    const result = await this.executeGcloud([
      'artifacts', 'repositories', 'list',
      '--location', location,
      '--format', 'json'
    ]);

    let repositories = [];
    if (result.success && result.stdout) {
      try {
        repositories = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_repositories',
      location: location,
      repositories: repositories,
      count: repositories.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listImages(command) {
    const params = parseKeyValueParams(command);
    const repository = params.repository;
    const location = params.location || 'us-central1';

    if (!repository) {
      throw new Error('Repository required: LIST IMAGES repository=... location=...');
    }

    const result = await this.executeGcloud([
      'artifacts', 'docker', 'images', 'list',
      `${location}-docker.pkg.dev/${this.parent.project}/${repository}`,
      '--format', 'json'
    ]);

    let images = [];
    if (result.success && result.stdout) {
      try {
        images = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_images',
      repository: repository,
      location: location,
      images: images,
      count: images.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listTags(command) {
    const params = parseKeyValueParams(command);
    const repository = params.repository;
    const image = params.image;
    const location = params.location || 'us-central1';

    if (!repository || !image) {
      throw new Error('Repository and image required: LIST TAGS repository=... image=... location=...');
    }

    const result = await this.executeGcloud([
      'artifacts', 'docker', 'tags', 'list',
      `${location}-docker.pkg.dev/${this.parent.project}/${repository}/${image}`,
      '--format', 'json'
    ]);

    let tags = [];
    if (result.success && result.stdout) {
      try {
        tags = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_tags',
      repository: repository,
      image: image,
      location: location,
      tags: tags,
      count: tags.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteImage(command) {
    const params = parseKeyValueParams(command);
    const repository = params.repository;
    const image = params.image;
    const tag = params.tag || 'latest';
    const location = params.location || 'us-central1';

    if (!repository || !image) {
      throw new Error('Repository and image required: DELETE IMAGE repository=... image=... [tag=...] location=...');
    }

    const imageUri = `${location}-docker.pkg.dev/${this.parent.project}/${repository}/${image}:${tag}`;

    const result = await this.executeGcloud([
      'artifacts', 'docker', 'images', 'delete',
      imageUri,
      '--quiet',
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'delete_image',
      repository: repository,
      image: image,
      tag: tag,
      location: location,
      imageUri: imageUri,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeRepository(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Repository name required: DESCRIBE REPOSITORY name=... location=...');
    }

    const result = await this.executeGcloud([
      'artifacts', 'repositories', 'describe', name,
      '--location', location,
      '--format', 'json'
    ]);

    let repoData = null;
    if (result.success && result.stdout) {
      try {
        repoData = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'describe_repository',
      repository: name,
      location: location,
      data: repoData,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      success: true,
      service: 'Artifact Registry',
      description: 'Manage container images and language packages',
      capabilities: [
        'CREATE REPOSITORY - Create an artifact repository',
        'DELETE REPOSITORY - Delete a repository',
        'LIST REPOSITORIES - List repositories',
        'LIST IMAGES - List container images',
        'LIST TAGS - List image tags',
        'DELETE IMAGE - Delete a container image',
        'DESCRIBE REPOSITORY - Get repository details'
      ],
      examples: {
        'Create Docker repository': 'ARTIFACT-REGISTRY CREATE REPOSITORY name=my-repo format=docker location=us-central1',
        'List images': 'ARTIFACT-REGISTRY LIST IMAGES repository=my-repo',
        'Delete image': 'ARTIFACT-REGISTRY DELETE IMAGE repository=my-repo image=myapp tag=v1.0.0'
      },
      formats: {
        docker: 'Docker container images',
        maven: 'Maven packages',
        npm: 'npm packages',
        python: 'Python packages',
        apt: 'Debian packages',
        yum: 'RPM packages'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = ArtifactRegistryHandler;
