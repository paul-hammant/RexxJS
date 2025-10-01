/* Cloud Tasks Handler - Asynchronous task execution */

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class CloudTasksHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async initialize() {
    // Tasks operations work via gcloud CLI
  }

  async handle(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    if (upperCommand.startsWith('CREATE QUEUE ')) {
      return await this.createQueue(trimmed.substring(13));
    }
    if (upperCommand.startsWith('DELETE QUEUE ')) {
      return await this.deleteQueue(trimmed.substring(13));
    }
    if (upperCommand.startsWith('LIST QUEUES')) {
      return await this.listQueues(trimmed.substring(11).trim());
    }
    if (upperCommand.startsWith('CREATE TASK ')) {
      return await this.createTask(trimmed.substring(12));
    }
    if (upperCommand.startsWith('LIST TASKS ')) {
      return await this.listTasks(trimmed.substring(11));
    }
    if (upperCommand.startsWith('DESCRIBE QUEUE ')) {
      return await this.describeQueue(trimmed.substring(15));
    }
    if (upperCommand.startsWith('PAUSE QUEUE ')) {
      return await this.pauseQueue(trimmed.substring(12));
    }
    if (upperCommand.startsWith('RESUME QUEUE ')) {
      return await this.resumeQueue(trimmed.substring(13));
    }
    if (upperCommand === 'INFO') {
      return this.getInfo();
    }

    throw new Error(`Unknown TASKS command: ${trimmed.split(' ')[0]}`);
  }

  async createQueue(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Queue name required: CREATE QUEUE name=... location=...');
    }

    const result = await this.executeGcloud([
      'tasks', 'queues', 'create', name,
      '--location', location,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'create_queue',
      queue: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async deleteQueue(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Queue name required: DELETE QUEUE name=... location=...');
    }

    const result = await this.executeGcloud([
      'tasks', 'queues', 'delete', name,
      '--location', location,
      '--quiet',
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'delete_queue',
      queue: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listQueues(command) {
    const params = parseKeyValueParams(command);
    const location = params.location || 'us-central1';

    const result = await this.executeGcloud([
      'tasks', 'queues', 'list',
      '--location', location,
      '--format', 'json'
    ]);

    let queues = [];
    if (result.success && result.stdout) {
      try {
        queues = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_queues',
      location: location,
      queues: queues,
      count: queues.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createTask(command) {
    const params = parseKeyValueParams(command);
    const queue = params.queue;
    const location = params.location || 'us-central1';
    const url = params.url;
    const payload = params.payload;
    const scheduleTime = params['schedule-time'];

    if (!queue) {
      throw new Error('Queue required: CREATE TASK queue=... url=... [payload=...] [schedule-time=...]');
    }

    const args = [
      'tasks', 'create-http-task',
      '--queue', queue,
      '--location', location,
      '--format', 'json'
    ];

    if (url) {
      args.push('--url', url);
    }

    if (payload) {
      args.push('--body-content', payload);
    }

    if (scheduleTime) {
      args.push('--schedule-time', scheduleTime);
    }

    const result = await this.executeGcloud(args);

    return {
      success: result.success,
      action: 'create_task',
      queue: queue,
      location: location,
      url: url,
      scheduled: scheduleTime || 'immediate',
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listTasks(command) {
    const params = parseKeyValueParams(command);
    const queue = params.queue;
    const location = params.location || 'us-central1';

    if (!queue) {
      throw new Error('Queue required: LIST TASKS queue=... location=...');
    }

    const result = await this.executeGcloud([
      'tasks', 'list',
      '--queue', queue,
      '--location', location,
      '--format', 'json'
    ]);

    let tasks = [];
    if (result.success && result.stdout) {
      try {
        tasks = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_tasks',
      queue: queue,
      location: location,
      tasks: tasks,
      count: tasks.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeQueue(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Queue name required: DESCRIBE QUEUE name=... location=...');
    }

    const result = await this.executeGcloud([
      'tasks', 'queues', 'describe', name,
      '--location', location,
      '--format', 'json'
    ]);

    let queueData = null;
    if (result.success && result.stdout) {
      try {
        queueData = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'describe_queue',
      queue: name,
      location: location,
      data: queueData,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async pauseQueue(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Queue name required: PAUSE QUEUE name=... location=...');
    }

    const result = await this.executeGcloud([
      'tasks', 'queues', 'pause', name,
      '--location', location,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'pause_queue',
      queue: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async resumeQueue(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Queue name required: RESUME QUEUE name=... location=...');
    }

    const result = await this.executeGcloud([
      'tasks', 'queues', 'resume', name,
      '--location', location,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'resume_queue',
      queue: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      success: true,
      service: 'Cloud Tasks',
      description: 'Asynchronous task execution service',
      capabilities: [
        'CREATE QUEUE - Create a task queue',
        'DELETE QUEUE - Delete a task queue',
        'LIST QUEUES - List all task queues',
        'CREATE TASK - Create an HTTP task',
        'LIST TASKS - List tasks in a queue',
        'DESCRIBE QUEUE - Get queue details',
        'PAUSE QUEUE - Pause task execution',
        'RESUME QUEUE - Resume task execution'
      ],
      examples: {
        'Create queue': 'TASKS CREATE QUEUE name=my-queue location=us-central1',
        'Create task': 'TASKS CREATE TASK queue=my-queue url=https://example.com/handler payload="{\\"data\\":\\"value\\"}"',
        'List tasks': 'TASKS LIST TASKS queue=my-queue',
        'Pause queue': 'TASKS PAUSE QUEUE name=my-queue'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = CloudTasksHandler;
