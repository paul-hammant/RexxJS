/* Cloud Run Handler - Serverless containers */

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class CloudRunHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async handle(command) {
    const trimmed = command.trim();
    const parts = trimmed.split(/\s+/);
    const action = parts[0].toUpperCase();

    switch (action) {
      case 'DEPLOY':
        return await this.deploy(parts.slice(1));
      case 'DELETE':
        return await this.delete(parts[1]);
      case 'UPDATE':
        return await this.update(parts.slice(1));
      case 'LIST':
        return await this.list();
      default:
        throw new Error(`Unknown RUN command: ${action}`);
    }
  }

  async deploy(params) {
    // DEPLOY name IMAGE 'image' REGION 'region'
    const name = params[0];
    const imageIndex = params.findIndex(p => p.toUpperCase() === 'IMAGE');
    const regionIndex = params.findIndex(p => p.toUpperCase() === 'REGION');

    if (imageIndex < 0) {
      throw new Error('IMAGE is required for Cloud Run deployment');
    }

    const image = params[imageIndex + 1].replace(/['"]/g, '');
    const region = regionIndex >= 0 ? params[regionIndex + 1].replace(/['"]/g, '') : 'us-central1';

    const args = ['run', 'deploy', name];
    args.push('--image', image);
    args.push('--region', region);
    args.push('--platform', 'managed');
    args.push('--allow-unauthenticated');

    if (this.parent.project) args.push('--project', this.parent.project);

    const result = await this.parent.execCommand('gcloud', args);

    // If deploy succeeded, get service details in JSON format
    if (result.success) {
      const describeArgs = ['run', 'services', 'describe', name, '--region', region, '--platform', 'managed', '--format=json'];
      if (this.parent.project) describeArgs.push('--project', this.parent.project);

      const describeResult = await this.parent.execCommand('gcloud', describeArgs);

      if (describeResult.success && describeResult.stdout) {
        try {
          const serviceData = JSON.parse(describeResult.stdout);
          return {
            success: true,
            name: name,
            image: image,
            region: region,
            url: serviceData.status?.url || null,
            ready: serviceData.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
            data: serviceData,
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
      image: image,
      region: region,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async delete(serviceName) {
    // DELETE service_name [REGION region]
    const args = ['run', 'services', 'delete', serviceName];
    args.push('--platform', 'managed');
    args.push('--region', this.parent.region || 'us-central1');
    args.push('--quiet');

    if (this.parent.project) args.push('--project', this.parent.project);

    const result = await this.parent.execCommand('gcloud', args);

    return {
      success: result.success,
      name: serviceName,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }
}

module.exports = CloudRunHandler;
