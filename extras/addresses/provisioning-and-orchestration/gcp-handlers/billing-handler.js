/**
 * Google Cloud Billing Handler - Billing management and cost tracking
 *
 * IMPORTANT: Billing data has 24-48 hour lag. Not suitable for real-time monitoring.
 * Use for daily budget checks and historical analysis only.
 */

const { CloudBillingClient } = require('@google-cloud/billing').v1;
const { spawn } = require('child_process');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}


class BillingHandler {
  constructor(parent, parseKeyValueParams) {
    this.parent = parent;
    this.parseKeyValueParams = parseKeyValueParams;
    this.billingClient = null;
    this.billingAccountId = null;
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

    // Apply RexxJS variable interpolation
    const interpolated = this.interpolateVariables(trimmed);
    const upperCommand = interpolated.toUpperCase();

    // INFO command - returns handler status
    if (upperCommand === 'INFO') {
      return {
        success: true,
        service: 'Cloud Billing',
        version: '2.0.0',
        status: 'initialized',
        capabilities: [
          'INFO', 'STATUS', 'LIST_ACCOUNTS', 'GET_PROJECT_BILLING',
          'CREATE BUDGET', 'LIST BUDGETS', 'DELETE BUDGET',
          'GET-COSTS', 'EXPORT-TO-BIGQUERY',
          'LIST SERVICES', 'LIST SKUS'
        ],
        billingAccountId: this.billingAccountId,
        dataLag: '24-48 hours',
        warning: 'Billing data is NOT real-time. Use for daily monitoring only.'
      };
    }

    // STATUS command - check billing status for current project
    if (upperCommand === 'STATUS') {
      return await this.getStatus();
    }

    // LIST_ACCOUNTS or LIST ACCOUNTS command - list all billing accounts
    if (upperCommand === 'LIST_ACCOUNTS' || upperCommand === 'LIST ACCOUNTS') {
      return await this.listAccounts();
    }

    // LIST BUDGETS command
    if (upperCommand === 'LIST BUDGETS' || upperCommand === 'LIST_BUDGETS') {
      return await this.listBudgets();
    }

    // LIST SERVICES command - list all billable services
    if (upperCommand === 'LIST SERVICES' || upperCommand === 'LIST_SERVICES') {
      return await this.listServices();
    }

    // LIST SKUS command - list SKUs for a service
    if (upperCommand.startsWith('LIST SKUS') || upperCommand.startsWith('LIST_SKUS')) {
      return await this.listSkus(trimmed);
    }

    // GET_PROJECT_BILLING command - get billing info for a specific project
    if (upperCommand.startsWith('GET_PROJECT_BILLING ') || upperCommand.startsWith('GET-PROJECT-BILLING ')) {
      const projectId = trimmed.split(/\s+/)[1];
      return await this.getProjectBilling(projectId);
    }

    // CREATE BUDGET command
    if (upperCommand.startsWith('CREATE BUDGET ')) {
      return await this.createBudget(trimmed.substring(14).trim());
    }

    // DELETE BUDGET command
    if (upperCommand.startsWith('DELETE BUDGET ')) {
      return await this.deleteBudget(trimmed.substring(14).trim());
    }

    // GET-COSTS command - query costs from BigQuery export
    if (upperCommand.startsWith('GET-COSTS') || upperCommand.startsWith('GET_COSTS')) {
      return await this.getCosts(trimmed);
    }

    // EXPORT-TO-BIGQUERY command - setup billing export
    if (upperCommand.startsWith('EXPORT-TO-BIGQUERY ') || upperCommand.startsWith('EXPORT_TO_BIGQUERY ')) {
      return await this.setupBigQueryExport(trimmed);
    }

    // QUERY_SPEND command - legacy, redirect to GET-COSTS
    if (upperCommand.startsWith('QUERY_SPEND') || upperCommand.startsWith('QUERY-SPEND')) {
      return await this.getCosts(trimmed);
    }

    throw new Error(`Unknown BILLING command: ${trimmed.split(' ')[0]}. Use: BILLING INFO for available commands`);
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

  async createBudget(params) {
    // Budget creation via gcloud CLI (Cloud Billing Budgets API requires beta)
    const parsed = this.parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const budgetName = parsed.name || parts[0];
    const amount = parsed.amount || parsed.budget;
    const threshold = parsed.threshold || '80,100';

    if (!amount) {
      throw new Error('AMOUNT required for budget creation. Usage: CREATE BUDGET name=monthly amount=1000 threshold=50,80,100');
    }

    if (!this.billingAccountId) {
      throw new Error('No billing account found. Cannot create budget.');
    }

    const cmdParts = [
      'gcloud', 'billing', 'budgets', 'create',
      '--billing-account', this.billingAccountId,
      '--display-name', budgetName,
      '--budget-amount', amount
    ];

    // Add threshold percentages
    if (threshold) {
      cmdParts.push('--threshold-rule', `percent=${threshold}`);
    }

    // Add notification settings if provided
    if (parsed.notify || parsed.pubsub) {
      const topic = parsed.notify || parsed.pubsub;
      cmdParts.push('--notifications-rule-pubsub-topic', topic);
    }

    cmdParts.push('--format', 'json');

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let budgetData = null;
      try {
        budgetData = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'created',
        budget: budgetName,
        amount: amount,
        threshold: threshold,
        billingAccount: this.billingAccountId,
        data: budgetData,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create budget: ${result.stderr || result.stdout}`);
  }

  async listBudgets() {
    if (!this.billingAccountId) {
      return {
        success: true,
        budgets: [],
        count: 0,
        note: 'No billing account found for current project'
      };
    }

    const result = await this.executeGcloud([
      'gcloud', 'billing', 'budgets', 'list',
      '--billing-account', this.billingAccountId,
      '--format', 'json'
    ]);

    if (result.success) {
      let budgets = [];
      try {
        budgets = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        budgets: budgets,
        count: budgets.length,
        billingAccount: this.billingAccountId,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list budgets: ${result.stderr || result.stdout}`);
  }

  async deleteBudget(params) {
    const parts = params.split(/\s+/);
    const budgetName = parts[0];

    if (!this.billingAccountId) {
      throw new Error('No billing account found. Cannot delete budget.');
    }

    const result = await this.executeGcloud([
      'gcloud', 'billing', 'budgets', 'delete', budgetName,
      '--billing-account', this.billingAccountId,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        budget: budgetName,
        billingAccount: this.billingAccountId,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete budget: ${result.stderr || result.stdout}`);
  }

  async listServices() {
    // List all billable GCP services
    const result = await this.executeGcloud([
      'gcloud', 'billing', 'accounts', 'services', 'list',
      '--billing-account', this.billingAccountId || 'all',
      '--format', 'json',
      '--limit', '100'
    ]);

    if (result.success) {
      let services = [];
      try {
        services = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        services: services,
        count: services.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    // Fallback: list common services
    return {
      success: true,
      note: 'Could not query billing services, returning common services',
      services: [
        { name: 'Compute Engine', serviceId: 'services/6F81-5844-456A' },
        { name: 'Cloud Storage', serviceId: 'services/95FF-2EF5-5EA1' },
        { name: 'BigQuery', serviceId: 'services/24E6-581D-38E5' },
        { name: 'Cloud Functions', serviceId: 'services/C654-6E2C-7F4D' },
        { name: 'Cloud Run', serviceId: 'services/E814-31F9-7199' },
        { name: 'Cloud SQL', serviceId: 'services/9662-B51E-5089' },
        { name: 'Cloud Logging', serviceId: 'services/5490-F9E9-7D45' },
        { name: 'Cloud Monitoring', serviceId: 'services/58CD-E5C3-1B18' }
      ],
      count: 8
    };
  }

  async listSkus(params) {
    // Parse service ID from command
    const parsed = this.parseKeyValueParams(params);
    const serviceId = parsed.service || parsed.for;

    if (!serviceId) {
      throw new Error('SERVICE required. Usage: LIST SKUS service=services/6F81-5844-456A');
    }

    const result = await this.executeGcloud([
      'gcloud', 'billing', 'accounts', 'services', 'skus', 'list',
      '--service', serviceId,
      '--format', 'json',
      '--limit', '50'
    ]);

    if (result.success) {
      let skus = [];
      try {
        skus = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        service: serviceId,
        skus: skus,
        count: skus.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list SKUs: ${result.stderr || result.stdout}`);
  }

  async getCosts(params) {
    // Query costs from BigQuery export
    // This requires billing export to be configured
    const parsed = this.parseKeyValueParams(params);
    const startDate = parsed.start || parsed.from;
    const endDate = parsed.end || parsed.to;
    const groupBy = parsed.group || parsed['group-by'] || 'service';

    return {
      success: false,
      error: 'BigQuery billing export not yet configured',
      explanation: 'Cost queries require billing data to be exported to BigQuery',
      setup: {
        step1: 'Enable billing export in Cloud Console',
        step2: 'Go to: https://console.cloud.google.com/billing -> Billing export',
        step3: 'Configure BigQuery export to a dataset',
        step4: 'Wait 24-48 hours for initial data population'
      },
      alternatives: [
        '1. Use Cloud Console Billing Reports (https://console.cloud.google.com/billing)',
        '2. Create budgets with BILLING CREATE BUDGET for threshold alerts',
        '3. Use BILLING LIST SERVICES to see billable services'
      ],
      futureQuery: {
        wouldQuery: `
          SELECT
            service.description as service,
            SUM(cost) as total_cost,
            currency
          FROM \`project.dataset.gcp_billing_export_*\`
          WHERE _PARTITION_TIME BETWEEN '${startDate || 'YYYY-MM-DD'}' AND '${endDate || 'YYYY-MM-DD'}'
          GROUP BY service, currency
          ORDER BY total_cost DESC
        `,
        note: 'This query will work once BigQuery export is configured'
      }
    };
  }

  async setupBigQueryExport(params) {
    // Instructions for setting up BigQuery export
    const parsed = this.parseKeyValueParams(params);
    const dataset = parsed.dataset || 'billing_export';

    return {
      success: false,
      action: 'setup_required',
      message: 'BigQuery billing export must be configured manually in Cloud Console',
      instructions: {
        step1: 'Go to Cloud Console: https://console.cloud.google.com/billing',
        step2: 'Select your billing account',
        step3: 'Click "Billing export" in the left menu',
        step4: 'Click "EDIT SETTINGS" under "BigQuery export"',
        step5: `Select or create dataset: ${dataset}`,
        step6: 'Click "Save" and wait 24-48 hours for data to populate'
      },
      afterSetup: {
        dataset: dataset,
        tables: [
          `${dataset}.gcp_billing_export_v1_*`,
          `${dataset}.gcp_billing_export_resource_v1_*`
        ],
        sampleQuery: `
          SELECT
            invoice.month,
            service.description as service,
            SUM(cost) as total_cost,
            currency
          FROM \`your-project.${dataset}.gcp_billing_export_v1_*\`
          WHERE _PARTITION_TIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
          GROUP BY invoice.month, service, currency
          ORDER BY invoice.month DESC, total_cost DESC
        `
      },
      note: 'Automated setup requires Cloud Billing API write permissions and is complex. Manual setup is recommended.'
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

module.exports = { BillingHandler };
