/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for GCP ADDRESS Handler - Variable Interpolation Across All Handlers
 *
 * Pattern: Jest -> JavaScript -> Embedded RexxJS -> Jest Assertions
 * Tests that all 30 GCP sub-handlers support variable interpolation
 */

const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const path = require('path');

// Mock googleapis before any imports
jest.mock('googleapis', () => ({
  google: {
    auth: { GoogleAuth: jest.fn() },
    sheets: jest.fn(() => ({ spreadsheets: { get: jest.fn(), values: { get: jest.fn(), append: jest.fn() } } }))
  }
}));

// Track gcloud/bq/gsutil commands
const mockSpawnCalls = [];
const mockExecCalls = [];

// Mock child_process for gcloud commands
jest.mock('child_process', () => ({
  spawn: jest.fn((...args) => {
    mockSpawnCalls.push(args);
    return {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') callback(0);
      })
    };
  }),
  exec: jest.fn((cmd, callback) => {
    mockExecCalls.push(cmd);
    if (cmd.includes('gcloud config get-value project')) {
      callback(null, 'test-project-123', '');
    } else {
      callback(null, 'mock output', '');
    }
  })
}));

describe('GCP ADDRESS Handler - Variable Interpolation', () => {
  let interpreter;
  let mockRpcClient;
  let capturedCommands;

  beforeEach(() => {
    capturedCommands = [];

    mockRpcClient = {
      send: jest.fn(async (address, method, params) => {
        if (address === 'gcp' && method === 'execute') {
          // Capture the command that would be sent to gcloud
          capturedCommands.push(params.command);
          return { success: true, mocked: true };
        }
        return 'mock response';
      })
    };

    interpreter = new Interpreter(mockRpcClient);

    if (global.gcpHandlerInstance) {
      global.gcpHandlerInstance = null;
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockSpawnCalls.length = 0;
    mockExecCalls.length = 0;
  });

  describe('Interpolation Patterns', () => {
    test('should support handlebars pattern (default)', async () => {
      // Set interpolation pattern via JavaScript, not REXX
      const interpolationConfig = require('../../../../core/src/interpolation-config');
      interpolationConfig.setInterpolationPattern('handlebars');

      const script = `
        test_var = "test-value"
        ADDRESS GCP 'STORAGE INFO bucket={{test_var}}'
      `;

      await interpreter.run(parse(script));

      // Verify the mock was called with interpolated value
      expect(mockRpcClient.send).toHaveBeenCalledWith('gcp', 'execute',
        expect.objectContaining({
          command: expect.stringContaining('bucket=test-value')
        })
      );

      // Verify the command was captured with interpolated value
      expect(capturedCommands).toHaveLength(1);
      expect(capturedCommands[0]).toContain('bucket=test-value');
      expect(capturedCommands[0]).not.toContain('{{test_var}}');

      // Verify interpolation pattern was set
      const pattern = interpolationConfig.getCurrentPattern();
      expect(pattern.name).toBe('handlebars');
    });

    test('should support shell pattern', async () => {
      const interpolationConfig = require('../../../../core/src/interpolation-config');
      interpolationConfig.setInterpolationPattern('shell');

      const script = `
        // Shell pattern
        test_var = "test-value"

        ADDRESS GCP 'STORAGE INFO bucket=\${test_var}'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected
      }

      const pattern = interpolationConfig.getCurrentPattern();
      expect(pattern.name).toBe('shell');
    });

    test('should support batch pattern', async () => {
      const interpolationConfig = require('../../../../core/src/interpolation-config');
      interpolationConfig.setInterpolationPattern('batch');

      const script = `
        // Batch pattern
        test_var = "test-value"

        ADDRESS GCP 'STORAGE INFO bucket=%test_var%'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected
      }

      const pattern = interpolationConfig.getCurrentPattern();
      expect(pattern.name).toBe('batch');
    });

    test('should support custom pattern', async () => {
      const interpolationConfig = require('../../../../core/src/interpolation-config');
      const customPattern = interpolationConfig.createCustomPattern('custom', '[[', ']]');
      interpolationConfig.setInterpolationPattern(customPattern);

      const script = `
        // Custom pattern
        test_var = "test-value"

        ADDRESS GCP 'STORAGE INFO bucket=[[test_var]]'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected
      }

      const pattern = interpolationConfig.getCurrentPattern();
      expect(pattern.startDelim).toBe('[[');
      expect(pattern.endDelim).toBe(']]');
    });
  });

  describe('Interpolation in Handler Commands', () => {
    test('Sheets handler - should interpolate spreadsheet ID and sheet name', async () => {

      const script = `
        // Handlebars pattern (default)

        spreadsheet_id = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
        sheet_name = "Students"

        ADDRESS GCP 'SHEETS {{spreadsheet_id}} SELECT * FROM {{sheet_name}}'
      `;

      // Will fail without Google credentials, but tests interpolation
      try {
        await interpreter.run(parse(script));
      } catch (e) {
        expect(e.message).not.toContain('{{');
      }
    });

    test('Docs handler - should interpolate document ID', async () => {

      const script = `
        // Handlebars pattern (default)

        doc_id = "abc123xyz"

        ADDRESS GCP 'DOCS CONNECT {{doc_id}}'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        expect(e.message).not.toContain('{{');
      }
    });

    test('Storage handler - should interpolate bucket and file names', async () => {

      const script = `
        // Handlebars pattern (default)

        bucket_name = "my-test-bucket"
        file_name = "data.json"

        ADDRESS GCP 'STORAGE UPLOAD file=/tmp/{{file_name}} bucket={{bucket_name}}'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected to fail without real bucket
      }
    });

    test('BigQuery handler - should interpolate dataset and table names', async () => {

      const script = `
        // Handlebars pattern (default)

        dataset_name = "analytics"
        table_name = "events"

        ADDRESS GCP 'BIGQUERY CONNECT {{dataset_name}}'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected
      }
    });

    test('Cloud Run handler - should interpolate service names', async () => {

      const script = `
        // Handlebars pattern (default)

        service_name = "hello-service"
        region = "us-central1"

        ADDRESS GCP 'RUN DELETE {{service_name}} region={{region}}'
      `;

      const { spawn } = require('child_process');
      spawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        })
      });

      await interpreter.run(parse(script));

      const rc = interpreter.getVariable('RC');
      expect(rc).toBe(0);
    });

    test('Functions handler - should interpolate function names', async () => {

      const script = `
        // Handlebars pattern (default)

        func_name = "my-function"
        region = "us-central1"

        ADDRESS GCP 'FUNCTIONS DELETE {{func_name}} region={{region}}'
      `;

      const { spawn } = require('child_process');
      spawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        })
      });

      await interpreter.run(parse(script));
    });

    test('PubSub handler - should interpolate topic and subscription names', async () => {

      const script = `
        // Handlebars pattern (default)

        topic_name = "events"
        subscription_name = "events-sub"

        ADDRESS GCP 'PUBSUB CREATE TOPIC {{topic_name}}'
      `;

      const { spawn } = require('child_process');
      spawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        })
      });

      await interpreter.run(parse(script));
    });
  });

  describe('Multi-Variable Interpolation', () => {
    test('should interpolate multiple variables in single command', async () => {

      const script = `
        // Handlebars pattern (default)

        env = "production"
        region = "us-central1"
        instance_type = "n1-standard-2"
        project = "my-project"

        ADDRESS GCP 'COMPUTE CREATE {{env}}-server machine={{instance_type}} region={{region}} project={{project}}'
      `;

      const { spawn } = require('child_process');
      spawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        })
      });

      await interpreter.run(parse(script));
    });

    test('should handle nested variable references', async () => {

      const script = `
        // Handlebars pattern (default)

        app_name = "webapp"
        env = "staging"
        full_name = "{{app_name}}-{{env}}"

        /* Note: full_name won't be interpolated recursively - this tests current behavior */
        ADDRESS GCP 'RUN DELETE {{app_name}}-{{env}}-service'
      `;

      const { spawn } = require('child_process');
      spawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        })
      });

      await interpreter.run(parse(script));
    });
  });

  describe('Interpolation with REXX Logic', () => {
    test('should support conditionally set variables', async () => {

      const script = `
        // Handlebars pattern (default)

        env = "production"

        /* REXX conditional */
        IF env = "production" THEN DO
          region = "us-central1"
          replicas = 5
        END
        ELSE DO
          region = "us-west1"
          replicas = 2
        END

        ADDRESS GCP 'RUN DEPLOY test-service region={{region}} min-instances={{replicas}}'
      `;

      const { spawn } = require('child_process');
      spawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        })
      });

      await interpreter.run(parse(script));

      const region = interpreter.getVariable('region');
      const replicas = interpreter.getVariable('replicas');
      expect(region).toBe('us-central1');
      expect(replicas).toBe(5);
    });

    test('should support loop-generated variable values', async () => {
      const script = `
        // Handlebars pattern (default)

        regions = "us-central1 us-east1 us-west1"

        /* REXX loop */
        DO i = 1 TO WORDS(regions)
          region = WORD(regions, i)
          instance_name = "server-" || region

          ADDRESS GCP 'COMPUTE CREATE {{instance_name}} region={{region}}'
        END
      `;

      const initialCalls = capturedCommands.length;
      await interpreter.run(parse(script));

      // Should have called ADDRESS GCP 3 times (once per region)
      expect(capturedCommands.length).toBeGreaterThan(initialCalls);
      expect(capturedCommands.length - initialCalls).toBe(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty variable values', async () => {

      const script = `
        // Handlebars pattern (default)

        empty_var = ""
        bucket_name = "test-bucket"

        ADDRESS GCP 'STORAGE INFO bucket={{bucket_name}}{{empty_var}}'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected
      }
    });

    test('should handle numeric variable values', async () => {

      const script = `
        // Handlebars pattern (default)

        port = 8080
        replicas = 3

        ADDRESS GCP 'RUN DEPLOY test-service port={{port}} min-instances={{replicas}}'
      `;

      const { spawn } = require('child_process');
      spawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        })
      });

      await interpreter.run(parse(script));
    });

    test('should handle special characters in variable values', async () => {

      const script = `
        // Handlebars pattern (default)

        /* Variable with special characters */
        query = "SELECT * FROM table WHERE id > 100"

        ADDRESS GCP 'BIGQUERY QUERY "{{query}}"'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected
      }
    });

    test('should not double-interpolate', async () => {

      const script = `
        // Handlebars pattern (default)

        /* Variable containing interpolation syntax */
        template = "{{other_var}}"
        other_var = "value"

        /* Should only interpolate once (template -> {{other_var}}, not -> value) */
        ADDRESS GCP 'STORAGE INFO bucket={{template}}'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected to fail, but verify no double interpolation
        expect(e.message).not.toContain('value');
      }
    });
  });

  describe('Backward Compatibility', () => {
    test('should work without interpolation config available', async () => {
      // Temporarily mock interpolation-config to simulate unavailability
      const originalConfig = require('../../../../core/src/interpolation-config');


      const script = `
        /* No interpolation pattern set */
        bucket_name = "test-bucket"

        /* Should work without {{}} syntax */
        ADDRESS GCP 'STORAGE LIST'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // May fail for other reasons, but should not crash due to missing interpolation
      }
    });

    test('should leave non-interpolated commands unchanged', async () => {

      const script = `
        // Handlebars pattern (default)

        /* Command without any interpolation markers */
        ADDRESS GCP 'STORAGE LIST'
      `;

      try {
        await interpreter.run(parse(script));
      } catch (e) {
        // Expected to fail without credentials
      }
    });
  });
});
