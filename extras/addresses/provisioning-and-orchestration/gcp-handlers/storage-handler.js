/* Storage Handler - Object storage and file management */

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}

const path = require('path');
const fs = require('fs');

class StorageHandler {
  constructor(parent) {
    this.parent = parent;
    this.storage = null;
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


  async initialize() {
    try {
      const { Storage } = require('@google-cloud/storage');
      this.storage = new Storage({
        projectId: this.parent.project
      });
    } catch (e) {
      // Storage SDK not available, will use gsutil
    }
  }

  async handle(command) {
    const trimmed = command.trim();

    // Apply RexxJS variable interpolation
    const interpolated = this.interpolateVariables(trimmed);
    const upperCommand = interpolated.toUpperCase();

    if (upperCommand.startsWith('UPLOAD ')) {
      return await this.upload(trimmed.substring(7));
    }
    if (upperCommand.startsWith('DOWNLOAD ')) {
      return await this.download(trimmed.substring(9));
    }
    if (upperCommand.startsWith('LIST ')) {
      return await this.list(trimmed.substring(5));
    }
    if (upperCommand.startsWith('DELETE ')) {
      return await this.delete(trimmed.substring(7));
    }
    if (upperCommand.startsWith('CREATE BUCKET ')) {
      return await this.createBucket(trimmed.substring(14));
    }

    throw new Error(`Unknown STORAGE command: ${trimmed.split(' ')[0]}`);
  }

  async upload(params) {
    // Parse standardized syntax: UPLOAD file="path" bucket="name" [as="remote-path"]
    const parsedParams = parseKeyValueParams(params);

    if (parsedParams.file && parsedParams.bucket) {
      // New standardized format
      const localFile = parsedParams.file;
      const bucket = parsedParams.bucket;
      const destination = parsedParams.as || path.basename(localFile);

      return await this.executeUpload(localFile, bucket, destination);
    }

    // Legacy format: FILE 'path' TO bucket='name' [AS 'remote-path']
    const match = params.match(/FILE\s+['"]([^'"]+)['"]\s+TO\s+bucket=['"]([^'"]+)['"](?:\s+AS\s+['"]([^'"]+)['"])?/i);

    if (!match) {
      throw new Error('Invalid UPLOAD syntax. Use: UPLOAD file="path" bucket="name" [as="remote-path"] or legacy FILE "path" TO bucket="name"');
    }

    const [_, localFile, bucket, remotePath] = match;
    const destination = remotePath || path.basename(localFile);

    return await this.executeUpload(localFile, bucket, destination);
  }

  async executeUpload(localFile, bucket, destination) {
    if (this.storage) {
      await this.storage.bucket(bucket).upload(localFile, {
        destination: destination
      });

      return {
        success: true,
        bucket: bucket,
        file: destination,
        size: fs.statSync(localFile).size
      };
    } else {
      // Use gsutil
      const result = await this.parent.execCommand('gsutil', [
        'cp', localFile, `gs://${bucket}/${destination}`
      ]);

      return {
        success: result.success,
        bucket: bucket,
        file: destination
      };
    }
  }
}

module.exports = StorageHandler;
