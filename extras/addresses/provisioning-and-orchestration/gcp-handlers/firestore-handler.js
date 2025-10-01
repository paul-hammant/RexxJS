/* Firestore Handler - NoSQL document database */

const { parseKeyValueParams } = require('../../../shared-utils/gcp-utils.js');

class FirestoreHandler {
  constructor(parent) {
    this.parent = parent;
    this.firestore = null;
    this.currentDatabase = null;
  }

  async initialize() {
    try {
      const { Firestore } = require('@google-cloud/firestore');
      this.firestore = new Firestore({
        projectId: this.parent.project
      });
    } catch (e) {
      // Firestore SDK not available
    }
  }

  async handle(command) {
    const trimmed = command.trim();

    // Path-based operations
    if (trimmed.startsWith('GET ')) {
      return await this.get(trimmed.substring(4));
    }
    if (trimmed.startsWith('SET ')) {
      return await this.set(trimmed.substring(4));
    }
    if (trimmed.startsWith('DELETE ')) {
      return await this.delete(trimmed.substring(7));
    }
    if (trimmed.startsWith('QUERY ')) {
      return await this.query(trimmed.substring(6));
    }
    if (trimmed.startsWith('WATCH ')) {
      return await this.watch(trimmed.substring(6));
    }

    throw new Error(`Unknown FIRESTORE command: ${trimmed.split(' ')[0]}`);
  }

  async get(path) {
    if (this.firestore) {
      const doc = await this.firestore.doc(path).get();
      return {
        success: true,
        exists: doc.exists,
        data: doc.exists ? doc.data() : null,
        id: doc.id,
        path: path
      };
    }

    // REST API implementation would go here
    throw new Error('Firestore SDK not available');
  }
}

module.exports = FirestoreHandler;
