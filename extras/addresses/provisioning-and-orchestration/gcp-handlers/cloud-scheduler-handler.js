/* Cloud Scheduler Handler - Fully managed cron job service */

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}


class CloudSchedulerHandler {
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


  async initialize() {
    // Scheduler operations work via gcloud CLI
  }

  async handle(command) {
    const trimmed = command.trim();

    // Apply RexxJS variable interpolation
    const interpolated = this.interpolateVariables(trimmed);
    const upperCommand = interpolated.toUpperCase();

    if (upperCommand.startsWith('CREATE JOB ')) {
      return await this.createJob(trimmed.substring(11));
    }
    if (upperCommand.startsWith('DELETE JOB ')) {
      return await this.deleteJob(trimmed.substring(11));
    }
    if (upperCommand.startsWith('LIST JOBS')) {
      return await this.listJobs(trimmed.substring(9).trim());
    }
    if (upperCommand.startsWith('RUN JOB ')) {
      return await this.runJob(trimmed.substring(8));
    }
    if (upperCommand.startsWith('PAUSE JOB ')) {
      return await this.pauseJob(trimmed.substring(10));
    }
    if (upperCommand.startsWith('RESUME JOB ')) {
      return await this.resumeJob(trimmed.substring(11));
    }
    if (upperCommand.startsWith('DESCRIBE JOB ')) {
      return await this.describeJob(trimmed.substring(13));
    }
    if (upperCommand === 'INFO') {
      return this.getInfo();
    }

    throw new Error(`Unknown SCHEDULER command: ${trimmed.split(' ')[0]}`);
  }

  async createJob(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const schedule = params.schedule;
    const location = params.location || 'us-central1';
    const uri = params.uri;
    const topic = params.topic;
    const messageBody = params['message-body'];

    if (!name || !schedule) {
      throw new Error('Job name and schedule required: CREATE JOB name=... schedule=... [uri=...] [topic=...]');
    }

    let args = [
      'scheduler', 'jobs', 'create'
    ];

    // Determine target type
    if (uri) {
      args.push('http', name);
      args.push('--schedule', schedule);
      args.push('--uri', uri);
      args.push('--location', location);
      if (messageBody) {
        args.push('--message-body', messageBody);
      }
    } else if (topic) {
      args.push('pubsub', name);
      args.push('--schedule', schedule);
      args.push('--topic', topic);
      args.push('--location', location);
      if (messageBody) {
        args.push('--message-body', messageBody);
      }
    } else {
      throw new Error('Either uri= or topic= must be specified for job target');
    }

    args.push('--format', 'json');

    const result = await this.executeGcloud(args);

    return {
      success: result.success,
      action: 'create_job',
      job: name,
      schedule: schedule,
      location: location,
      target: uri || topic,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteJob(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Job name required: DELETE JOB name=... location=...');
    }

    const result = await this.executeGcloud([
      'scheduler', 'jobs', 'delete', name,
      '--location', location,
      '--quiet',
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'delete_job',
      job: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listJobs(command) {
    const params = parseKeyValueParams(command);
    const location = params.location || 'us-central1';

    const result = await this.executeGcloud([
      'scheduler', 'jobs', 'list',
      '--location', location,
      '--format', 'json'
    ]);

    let jobs = [];
    if (result.success && result.stdout) {
      try {
        jobs = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_jobs',
      location: location,
      jobs: jobs,
      count: jobs.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async runJob(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Job name required: RUN JOB name=... location=...');
    }

    const result = await this.executeGcloud([
      'scheduler', 'jobs', 'run', name,
      '--location', location,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'run_job',
      job: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async pauseJob(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Job name required: PAUSE JOB name=... location=...');
    }

    const result = await this.executeGcloud([
      'scheduler', 'jobs', 'pause', name,
      '--location', location,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'pause_job',
      job: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async resumeJob(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Job name required: RESUME JOB name=... location=...');
    }

    const result = await this.executeGcloud([
      'scheduler', 'jobs', 'resume', name,
      '--location', location,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'resume_job',
      job: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeJob(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Job name required: DESCRIBE JOB name=... location=...');
    }

    const result = await this.executeGcloud([
      'scheduler', 'jobs', 'describe', name,
      '--location', location,
      '--format', 'json'
    ]);

    let jobData = null;
    if (result.success && result.stdout) {
      try {
        jobData = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'describe_job',
      job: name,
      location: location,
      data: jobData,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      success: true,
      service: 'Cloud Scheduler',
      description: 'Fully managed cron job service',
      capabilities: [
        'CREATE JOB - Create a scheduled job',
        'DELETE JOB - Delete a scheduled job',
        'LIST JOBS - List all scheduled jobs',
        'RUN JOB - Manually trigger a job',
        'PAUSE JOB - Pause job execution',
        'RESUME JOB - Resume job execution',
        'DESCRIBE JOB - Get job details'
      ],
      examples: {
        'Create HTTP job': 'SCHEDULER CREATE JOB name=hourly-task schedule="0 * * * *" uri=https://example.com/task',
        'Create Pub/Sub job': 'SCHEDULER CREATE JOB name=daily-job schedule="0 0 * * *" topic=my-topic message-body="daily run"',
        'Run job now': 'SCHEDULER RUN JOB name=hourly-task',
        'Pause job': 'SCHEDULER PAUSE JOB name=hourly-task'
      },
      cron_format: {
        description: 'Schedule uses Unix cron format: minute hour day month weekday',
        examples: {
          'Every hour': '0 * * * *',
          'Every day at midnight': '0 0 * * *',
          'Every Monday at 9am': '0 9 * * 1',
          'Every 15 minutes': '*/15 * * * *',
          'First day of month': '0 0 1 * *'
        }
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = CloudSchedulerHandler;
