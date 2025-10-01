/* PubSub Handler - Messaging and event streaming */

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class PubSubHandler {
  constructor(parent) {
    this.parent = parent;
    this.pubsub = null;
  }

  async initialize() {
    try {
      const { PubSub } = require('@google-cloud/pubsub');
      this.pubsub = new PubSub({
        projectId: this.parent.project
      });
    } catch (e) {
      // PubSub SDK not available
    }
  }

  async handle(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    if (upperCommand.startsWith('CREATE TOPIC ')) {
      return await this.createTopic(trimmed.substring(13));
    }
    if (upperCommand.startsWith('PUBLISH ')) {
      return await this.publish(trimmed.substring(8));
    }
    if (upperCommand.startsWith('SUBSCRIBE ')) {
      return await this.subscribe(trimmed.substring(10));
    }
    if (upperCommand.startsWith('PULL ')) {
      return await this.pull(trimmed.substring(5));
    }

    throw new Error(`Unknown PUBSUB command: ${trimmed.split(' ')[0]}`);
  }

  async publish(params) {
    // Parse standardized syntax: PUBLISH topic="name" message="data"
    const parsedParams = parseKeyValueParams(params);

    if (parsedParams.topic && parsedParams.message) {
      // New standardized format
      return await this.executePublish(parsedParams.topic, parsedParams.message);
    }

    // Legacy format: topic MESSAGE 'data'
    const match = params.match(/([\w-]+)\s+MESSAGE\s+['"](.+)['"]$/i);

    if (!match) {
      throw new Error('Invalid PUBLISH syntax. Use: PUBLISH topic="name" message="data" or legacy topic MESSAGE "data"');
    }

    const [_, topic, message] = match;
    return await this.executePublish(topic, message);
  }

  async executePublish(topic, message) {
    if (this.pubsub) {
      const messageId = await this.pubsub.topic(topic).publish(Buffer.from(message));
      return {
        success: true,
        messageId: messageId,
        topic: topic
      };
    } else {
      // Use gcloud
      const result = await this.parent.execCommand('gcloud', [
        'pubsub', 'topics', 'publish', topic,
        '--message', message
      ]);

      return {
        success: result.success,
        topic: topic
      };
    }
  }
}

module.exports = PubSubHandler;
