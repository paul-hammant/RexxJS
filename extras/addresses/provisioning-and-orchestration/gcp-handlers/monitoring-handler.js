/* Cloud Monitoring Handler - Metrics and alerting */

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');
const { spawn } = require('child_process');

class MonitoringHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async handle(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    if (upperCommand.startsWith('CREATE METRIC ')) {
      return await this.createMetric(trimmed.substring(14).trim());
    }
    if (upperCommand.startsWith('WRITE ')) {
      return await this.writeMetric(trimmed.substring(6).trim());
    }
    if (upperCommand.startsWith('CREATE ALERT ')) {
      return await this.createAlert(trimmed.substring(13).trim());
    }
    if (upperCommand.startsWith('CREATE UPTIME-CHECK ')) {
      return await this.createUptimeCheck(trimmed.substring(20).trim());
    }
    if (upperCommand.startsWith('LIST METRICS') || upperCommand === 'LIST') {
      return await this.listMetrics(trimmed);
    }
    if (upperCommand.startsWith('READ ')) {
      return await this.readMetrics(trimmed.substring(5).trim());
    }

    throw new Error(`Unknown MONITORING command: ${trimmed.split(' ')[0]}`);
  }

  async createMetric(params) {
    // Simplified: Custom metrics require Monitoring API
    const parsed = parseKeyValueParams(params);
    const parts = params.trim().split(/\s+/);
    const metricName = parsed.name || parts[0];
    const metricType = parsed.type || 'gauge';

    return {
      success: true,
      action: 'create_metric',
      metric: metricName,
      type: metricType,
      message: 'Custom metric creation requires Monitoring API client library. Use gcloud or API directly.',
      note: 'This is a placeholder. Implement with @google-cloud/monitoring SDK for production use.'
    };
  }

  async writeMetric(params) {
    // Placeholder for writing metric data
    const parsed = parseKeyValueParams(params);

    return {
      success: true,
      action: 'write_metric',
      metric: parsed.metric,
      value: parsed.value,
      message: 'Metric writing requires Monitoring API client library.',
      note: 'This is a placeholder. Implement with @google-cloud/monitoring SDK for production use.'
    };
  }

  async createAlert(params) {
    // Simplified: Alert policies require Monitoring API
    const parsed = parseKeyValueParams(params);
    const alertName = parsed.name || params.split(/\s+/)[0];

    return {
      success: true,
      action: 'create_alert',
      alert: alertName,
      message: 'Alert policy creation requires Monitoring API client library.',
      note: 'This is a placeholder. Implement with @google-cloud/monitoring SDK for production use.'
    };
  }

  async createUptimeCheck(params) {
    // Simplified: Uptime checks require Monitoring API
    const parsed = parseKeyValueParams(params);
    const checkName = parsed.name || params.split(/\s+/)[0];
    const url = parsed.url;

    return {
      success: true,
      action: 'create_uptime_check',
      check: checkName,
      url: url,
      message: 'Uptime check creation requires Monitoring API client library.',
      note: 'This is a placeholder. Implement with @google-cloud/monitoring SDK for production use.'
    };
  }

  async listMetrics(params) {
    // Use gcloud to list metric descriptors
    const parsed = parseKeyValueParams(params);
    const filter = parsed.filter || 'metric.type:custom.googleapis.com/*';

    const result = await this.executeGcloud([
      'gcloud', 'monitoring', 'metrics-descriptors', 'list',
      '--filter', filter,
      '--format', 'json'
    ]);

    if (result.success) {
      let metrics = [];
      try {
        metrics = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'list_metrics',
        metrics: metrics,
        count: metrics.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list metrics: ${result.stderr || result.stdout}`);
  }

  async readMetrics(params) {
    // Placeholder for reading time series data
    const parsed = parseKeyValueParams(params);

    return {
      success: true,
      action: 'read_metrics',
      metric: parsed.metric,
      message: 'Time series reading requires Monitoring API client library.',
      note: 'This is a placeholder. Implement with @google-cloud/monitoring SDK for production use.'
    };
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

module.exports = MonitoringHandler;
