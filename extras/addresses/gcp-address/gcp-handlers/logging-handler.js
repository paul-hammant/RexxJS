/* Cloud Logging Handler - Log management and analysis */

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
} catch (e) {
  // Not available - will use simpler variable resolution
}

const { spawn } = require('child_process');

class LoggingHandler {
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

    if (upperCommand.startsWith('READ ')) {
      return await this.readLogs(trimmed.substring(5).trim());
    }
    if (upperCommand.startsWith('CREATE SINK ')) {
      return await this.createSink(trimmed.substring(12).trim());
    }
    if (upperCommand.startsWith('CREATE METRIC ')) {
      return await this.createLogMetric(trimmed.substring(14).trim());
    }
    if (upperCommand.startsWith('LIST SINKS') || upperCommand === 'LIST') {
      return await this.listSinks();
    }
    if (upperCommand.startsWith('DELETE SINK ')) {
      return await this.deleteSink(trimmed.substring(12).trim());
    }

    throw new Error(`Unknown LOGGING command: ${trimmed.split(' ')[0]}`);
  }

  async readLogs(params) {
    // Parse: FILTER "filter" [LIMIT n] [TIME-RANGE range]
    const parsed = parseKeyValueParams(params);
    const filter = parsed.filter || params.split(/\s+/)[0];
    const limit = parsed.limit || '50';

    const cmdParts = [
      'gcloud', 'logging', 'read',
      filter,
      '--limit', limit,
      '--format', 'json'
    ];

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let logs = [];
      try {
        logs = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'read_logs',
        logs: logs,
        count: logs.length,
        filter: filter,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to read logs: ${result.stderr || result.stdout}`);
  }

  async createSink(params) {
    // Parse: name DESTINATION dest FILTER "filter"
    const parsed = parseKeyValueParams(params);
    const parts = params.trim().split(/\s+/);
    const sinkName = parsed.name || parts[0];
    const destination = parsed.destination || parsed.dest;
    const filter = parsed.filter || '';

    if (!destination) {
      throw new Error('DESTINATION required for creating log sink');
    }

    const cmdParts = [
      'gcloud', 'logging', 'sinks', 'create', sinkName,
      destination,
      '--log-filter', filter
    ];

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      return {
        success: true,
        action: 'create_sink',
        sink: sinkName,
        destination: destination,
        filter: filter,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create log sink: ${result.stderr || result.stdout}`);
  }

  async createLogMetric(params) {
    // Parse: name FILTER "filter"
    const parsed = parseKeyValueParams(params);
    const parts = params.trim().split(/\s+/);
    const metricName = parsed.name || parts[0];
    const filter = parsed.filter || '';
    const description = parsed.description || 'Log-based metric';

    const cmdParts = [
      'gcloud', 'logging', 'metrics', 'create', metricName,
      '--log-filter', filter,
      '--description', description
    ];

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      return {
        success: true,
        action: 'create_log_metric',
        metric: metricName,
        filter: filter,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create log metric: ${result.stderr || result.stdout}`);
  }

  async listSinks() {
    const result = await this.executeGcloud([
      'gcloud', 'logging', 'sinks', 'list',
      '--format', 'json'
    ]);

    if (result.success) {
      let sinks = [];
      try {
        sinks = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'list_sinks',
        sinks: sinks,
        count: sinks.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list log sinks: ${result.stderr || result.stdout}`);
  }

  async deleteSink(params) {
    const parts = params.trim().split(/\s+/);
    const sinkName = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'logging', 'sinks', 'delete', sinkName,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'delete_sink',
        sink: sinkName,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete log sink: ${result.stderr || result.stdout}`);
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

module.exports = LoggingHandler;
