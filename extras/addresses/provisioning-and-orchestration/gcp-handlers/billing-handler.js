/**
 * Google Cloud Billing Handler - Extracted billing query capability
 *
 * IMPORTANT: Billing data has 24-48 hour lag. Not suitable for real-time monitoring.
 * Use for daily budget checks and historical analysis only.
 */

const { CloudBillingClient } = require('@google-cloud/billing').v1;

class BillingHandler {
  constructor(parent, parseKeyValueParams) {
    this.parent = parent;
    this.parseKeyValueParams = parseKeyValueParams;
    this.billingClient = null;
    this.billingAccountId = null;
  }

  async initialize() {
    console.log('[BillingHandler] Initializing...');

    try {
      // Initialize Cloud Billing client
      this.billingClient = new CloudBillingClient({
        projectId: this.parent.project
      });

      // Try to get billing account for current project
      const projectId = this.parent.project || await this.getDefaultProject();
      if (projectId) {
        const projectName = `projects/${projectId}`;
        const [billingInfo] = await this.billingClient.getProjectBillingInfo({ name: projectName });

        if (billingInfo && billingInfo.billingAccountName) {
          // Extract account ID from name like "billingAccounts/012345-67890A-BCDEF0"
          this.billingAccountId = billingInfo.billingAccountName.split('/')[1];
          console.log(`[BillingHandler] Found billing account: ${this.billingAccountId}`);
        } else {
          console.log('[BillingHandler] No billing account found for project');
        }
      }

      console.log('[BillingHandler] Initialized successfully');
    } catch (e) {
      console.error('[BillingHandler] Initialization error:', e.message);
      // Don't fail - billing queries just won't work
    }
  }

  async getDefaultProject() {
    // Try parent's project first
    if (this.parent.project) {
      return this.parent.project;
    }

    // Try to get project from environment credentials
    try {
      const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credsPath) {
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.resolve(credsPath);
        if (fs.existsSync(fullPath)) {
          const creds = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (creds.project_id) {
            return creds.project_id;
          }
        }
      }
    } catch (e) {
      // Ignore
    }

    // Try to get project from gcloud config (if gcloud is installed)
    try {
      const result = await this.parent.execCommand('gcloud', ['config', 'get-value', 'project']);
      if (result.success && result.stdout) {
        return result.stdout.trim();
      }
    } catch (e) {
      // Ignore
    }

    return null;
  }

  async execute(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    // INFO command - returns handler status
    if (upperCommand === 'INFO') {
      return {
        success: true,
        service: 'Cloud Billing',
        version: '1.0.0',
        status: 'initialized',
        capabilities: ['INFO', 'STATUS', 'LIST_ACCOUNTS', 'GET_PROJECT_BILLING'],
        billingAccountId: this.billingAccountId,
        dataLag: '24-48 hours',
        warning: 'Billing data is NOT real-time. Use for daily monitoring only.'
      };
    }

    // STATUS command - check billing status for current project
    if (upperCommand === 'STATUS') {
      return await this.getStatus();
    }

    // LIST_ACCOUNTS command - list all billing accounts
    if (upperCommand === 'LIST_ACCOUNTS') {
      return await this.listAccounts();
    }

    // GET_PROJECT_BILLING command - get billing info for a specific project
    if (upperCommand.startsWith('GET_PROJECT_BILLING ')) {
      const projectId = trimmed.substring(20).trim();
      return await this.getProjectBilling(projectId);
    }

    // QUERY_SPEND command - attempt to get spend info (with warning)
    if (upperCommand.startsWith('QUERY_SPEND')) {
      return await this.querySpend(trimmed.substring(11).trim());
    }

    throw new Error(`Unknown BILLING command: ${trimmed.split(' ')[0]}. Available: INFO, STATUS, LIST_ACCOUNTS, GET_PROJECT_BILLING, QUERY_SPEND`);
  }

  async getStatus() {
    if (!this.billingClient) {
      throw new Error('Billing client not initialized. Check authentication.');
    }

    try {
      const projectId = this.parent.project || await this.getDefaultProject();
      if (!projectId) {
        throw new Error('No project specified. Set project in GCP handler or gcloud config.');
      }

      const projectName = `projects/${projectId}`;
      const [billingInfo] = await this.billingClient.getProjectBillingInfo({ name: projectName });

      return {
        success: true,
        project: projectId,
        billingEnabled: billingInfo.billingEnabled,
        billingAccountName: billingInfo.billingAccountName,
        billingAccountId: this.billingAccountId,
        dataLag: '24-48 hours',
        note: 'This only shows if billing is enabled, not actual costs. Use QUERY_SPEND for cost data (with 24h lag).'
      };
    } catch (e) {
      throw new Error(`Failed to get billing status: ${e.message}`);
    }
  }

  async listAccounts() {
    if (!this.billingClient) {
      throw new Error('Billing client not initialized. Check authentication.');
    }

    try {
      const [accounts] = await this.billingClient.listBillingAccounts({
        pageSize: 50
      });

      return {
        success: true,
        count: accounts.length,
        accounts: accounts.map(acc => ({
          name: acc.name,
          displayName: acc.displayName,
          open: acc.open,
          masterBillingAccount: acc.masterBillingAccount
        })),
        note: 'These are billing accounts you have access to. Does not show current spend.'
      };
    } catch (e) {
      throw new Error(`Failed to list billing accounts: ${e.message}`);
    }
  }

  async getProjectBilling(projectId) {
    if (!this.billingClient) {
      throw new Error('Billing client not initialized. Check authentication.');
    }

    try {
      const projectName = `projects/${projectId}`;
      const [billingInfo] = await this.billingClient.getProjectBillingInfo({ name: projectName });

      return {
        success: true,
        project: projectId,
        billingEnabled: billingInfo.billingEnabled,
        billingAccountName: billingInfo.billingAccountName,
        billingAccountId: billingInfo.billingAccountName ? billingInfo.billingAccountName.split('/')[1] : null,
        note: 'This shows billing configuration only, not costs.'
      };
    } catch (e) {
      throw new Error(`Failed to get project billing: ${e.message}`);
    }
  }

  async querySpend(params) {
    // This is a placeholder for future BigQuery-based spend queries
    // The Cloud Billing API does NOT provide direct spend data

    return {
      success: false,
      error: 'Direct spend queries not yet implemented',
      explanation: 'The Cloud Billing API does not provide current spend data directly.',
      alternatives: [
        '1. Export billing to BigQuery (setup in Cloud Console)',
        '2. Use Cloud Billing Reports in Console (https://console.cloud.google.com/billing)',
        '3. Set up Budget API alerts for threshold notifications'
      ],
      dataLag: '24-48 hours even if implemented',
      recommendation: 'Use cost estimation (RUN COST_ESTIMATE) for real-time safety instead',
      futureImplementation: {
        requires: 'BigQuery billing export setup',
        willProvide: 'Historical cost data by service, region, SKU',
        stillHasLag: '24-48 hours minimum'
      }
    };
  }
}

module.exports = { BillingHandler };
