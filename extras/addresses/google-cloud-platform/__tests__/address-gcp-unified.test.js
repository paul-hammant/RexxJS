const { UnifiedGcpHandler, ADDRESS_GCP_HANDLER, GCP_ADDRESS_META, parseKeyValueParams } = require('../address-gcp');

describe('Unified GCP ADDRESS Handler', () => {
  let handler;
  let mockExecCommand;

  beforeEach(async () => {
    handler = new UnifiedGcpHandler();

    // Mock execCommand
    mockExecCommand = jest.fn().mockResolvedValue({
      success: true,
      stdout: '',
      stderr: ''
    });
    handler.execCommand = mockExecCommand;

    // Initialize handlers that tests will use (lazy loaded)
    const { SheetsHandler } = require('../gcp-handlers/sheets-handler');
    const { BigQueryHandler } = require('../gcp-handlers/bigquery-handler');
    const FirestoreHandler = require('../gcp-handlers/firestore-handler');
    const StorageHandler = require('../gcp-handlers/storage-handler');
    const PubSubHandler = require('../gcp-handlers/pubsub-handler');
    const FunctionsHandler = require('../gcp-handlers/functions-handler');
    const CloudRunHandler = require('../gcp-handlers/cloud-run-handler');

    handler.services.sheets = new SheetsHandler(handler, parseKeyValueParams);
    handler.services.bigquery = new BigQueryHandler(handler, parseKeyValueParams);
    handler.services.firestore = new FirestoreHandler(handler, parseKeyValueParams);
    handler.services.storage = new StorageHandler(handler, parseKeyValueParams);
    handler.services.pubsub = new PubSubHandler(handler, parseKeyValueParams);
    handler.services.functions = new FunctionsHandler(handler, parseKeyValueParams);
    handler.services.run = new CloudRunHandler(handler, parseKeyValueParams);

    // Initialize sheets handler
    await handler.services.sheets.initialize();

    // Mock Google API clients
    if (handler.services.sheets) {
      handler.services.sheets.currentSpreadsheet = 'test-spreadsheet-id'; // Set connected spreadsheet
      handler.services.sheets.sheets = {
        spreadsheets: {
          get: jest.fn().mockResolvedValue({
            data: {
              properties: { title: 'Test Sheet' },
              sheets: [{ properties: { title: 'Sheet1' } }]
            }
          }),
          values: {
            get: jest.fn().mockResolvedValue({
              data: { values: [['A1', 'B1'], ['A2', 'B2']] }
            }),
            append: jest.fn().mockResolvedValue({
              data: { updates: { updatedRange: 'Sheet1!A3', updatedRows: 1 } }
            })
          }
        }
      };
    }

    // Mock Firestore client
    if (handler.services.firestore) {
      handler.services.firestore.firestore = {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ name: 'John', age: 30 }),
            id: 'john'
          })
        })
      };
    }

    // Mock Storage handler list method
    if (handler.services.storage) {
      handler.services.storage.list = jest.fn().mockResolvedValue({
        success: true,
        bucket: 'images',
        files: []
      });
    }

  });

  describe('Service Routing', () => {
    it('should route SHEETS commands correctly', async () => {
      const spy = jest.spyOn(handler.services.sheets, 'handle');
      await handler.execute('SHEETS SELECT * FROM Sheet1');
      expect(spy).toHaveBeenCalledWith('SELECT * FROM Sheet1');
    });

    it('should route BIGQUERY commands correctly', async () => {
      const spy = jest.spyOn(handler.services.bigquery, 'handle');
      await handler.execute('BIGQUERY SELECT * FROM table');
      expect(spy).toHaveBeenCalledWith('SELECT * FROM table');
    });

    it('should route FIRESTORE commands correctly', async () => {
      const spy = jest.spyOn(handler.services.firestore, 'handle');
      await handler.execute('FIRESTORE GET /users/john');
      expect(spy).toHaveBeenCalledWith('GET /users/john');
    });

    it('should route STORAGE commands correctly', async () => {
      const spy = jest.spyOn(handler.services.storage, 'handle');
      await handler.execute('STORAGE LIST BUCKET images');
      expect(spy).toHaveBeenCalledWith('LIST BUCKET images');
    });

    it('should route PUBSUB commands correctly', async () => {
      const spy = jest.spyOn(handler.services.pubsub, 'handle');
      await handler.execute('PUBSUB PUBLISH topic MESSAGE "test"');
      expect(spy).toHaveBeenCalledWith('PUBLISH topic MESSAGE "test"');
    });

    it('should handle alternative service names', async () => {
      const spy = jest.spyOn(handler.services.sheets, 'handle');
      await handler.execute('SHEET SELECT * FROM Sheet1');
      expect(spy).toHaveBeenCalledWith('SELECT * FROM Sheet1');
    });

    it('should throw error for unknown service', async () => {
      await expect(handler.execute('UNKNOWN command')).rejects.toThrow('Unknown GCP service: UNKNOWN');
    });
  });

  describe('SHEETS Commands', () => {
    const sheets = () => handler.services.sheets;

    it('should handle CONNECT command', async () => {
      const result = await sheets().handle('CONNECT spreadsheet="abc123"');
      expect(result.success).toBe(true);
      expect(result.spreadsheetId).toBe('abc123');
      expect(result.title).toBe('Test Sheet');
    });

    it('should handle direct sheet reference', async () => {
      const result = await sheets().handle('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM Sheet1');
      expect(result.spreadsheetId).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
      expect(result.rows).toEqual([['A1', 'B1'], ['A2', 'B2']]);
    });

    it('should handle SELECT command', async () => {
      sheets().currentSpreadsheet = 'abc123';
      const result = await sheets().handle('SELECT A,B FROM Sheet1');
      expect(result.success).toBe(true);
      expect(result.rows).toEqual([['A1', 'B1'], ['A2', 'B2']]);
      expect(result.columns).toBe('A,B');
      expect(result.sheet).toBe('Sheet1');
    });

    it('should handle INSERT command', async () => {
      sheets().currentSpreadsheet = 'abc123';
      const result = await sheets().handle('INSERT INTO Sheet1 VALUES ("test", 123, true)');
      expect(result.success).toBe(true);
      expect(result.updatedRange).toBe('Sheet1!A3');
      expect(result.sheet).toBe('Sheet1');
    });

    it('should parse values correctly', () => {
      const values = sheets().parseValues('"text", 123, true, NULL, 45.67');
      expect(values).toEqual(['text', 123, true, null, 45.67]);
    });

    it('should normalize columns correctly', () => {
      expect(sheets().normalizeColumns('*')).toBe('A:ZZ');
      expect(sheets().normalizeColumns('A,B,C')).toBe('A:C');
      expect(sheets().normalizeColumns('B:E')).toBe('B:E');
    });
  });

  describe('BIGQUERY Commands', () => {
    const bq = () => handler.services.bigquery;

    it('should handle SQL queries via gcloud', async () => {
      mockExecCommand.mockResolvedValue({
        success: true,
        stdout: '[{"name": "John", "age": 30}]'
      });

      const result = await bq().handle('SELECT * FROM users');
      expect(result.success).toBe(true);
      expect(result.rows).toEqual([{ name: 'John', age: 30 }]);
      expect(mockExecCommand).toHaveBeenCalledWith('bq', expect.arrayContaining(['query']));
    });
  });

  describe('FIRESTORE Commands', () => {
    const fs = () => handler.services.firestore;

    it('should handle GET command', async () => {
      fs().firestore = {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ name: 'John', age: 30 }),
            id: 'john'
          })
        })
      };

      const result = await fs().handle('GET /users/john');
      expect(result.success).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 30 });
      expect(result.path).toBe('/users/john');
    });
  });

  describe('STORAGE Commands', () => {
    const storage = () => handler.services.storage;

    it('should handle UPLOAD command via gsutil', async () => {
      const result = await storage().handle('UPLOAD FILE "/tmp/test.txt" TO bucket="my-bucket" AS "folder/test.txt"');
      expect(result.success).toBe(true);
      expect(result.bucket).toBe('my-bucket');
      expect(result.file).toBe('folder/test.txt');
      expect(mockExecCommand).toHaveBeenCalledWith('gsutil', ['cp', '/tmp/test.txt', 'gs://my-bucket/folder/test.txt']);
    });
  });

  describe('PUBSUB Commands', () => {
    const pubsub = () => handler.services.pubsub;

    it('should handle PUBLISH command via gcloud', async () => {
      const result = await pubsub().handle('PUBLISH my-topic MESSAGE "Hello World"');
      expect(result.success).toBe(true);
      expect(result.topic).toBe('my-topic');
      expect(mockExecCommand).toHaveBeenCalledWith('gcloud',
        expect.arrayContaining(['pubsub', 'topics', 'publish', 'my-topic', '--message', 'Hello World']));
    });
  });

  describe('FUNCTIONS Commands', () => {
    const functions = () => handler.services.functions;

    it('should handle DEPLOY command', async () => {
      const result = await functions().handle('DEPLOY my-func SOURCE "./src" TRIGGER "http" RUNTIME "python39"');
      expect(result.success).toBe(true);
      expect(result.name).toBe('my-func');
      expect(result.trigger).toBe('http');
      expect(result.runtime).toBe('python39');
      expect(mockExecCommand).toHaveBeenCalledWith('gcloud',
        expect.arrayContaining(['functions', 'deploy', 'my-func']));
    });
  });

  describe('RUN Commands', () => {
    const run = () => handler.services.run;

    it('should handle DEPLOY command', async () => {
      const result = await run().handle('DEPLOY my-app IMAGE "gcr.io/project/app" REGION "us-central1"');
      expect(result.success).toBe(true);
      expect(result.name).toBe('my-app');
      expect(result.image).toBe('gcr.io/project/app');
      expect(result.region).toBe('us-central1');
      expect(mockExecCommand).toHaveBeenCalledWith('gcloud',
        expect.arrayContaining(['run', 'deploy', 'my-app', '--image', 'gcr.io/project/app']));
    });
  });

  describe('ADDRESS_GCP_HANDLER Function', () => {
    it('should handle string commands', async () => {
      const result = await handler.execute('SHEETS CONNECT spreadsheet="abc123"');
      expect(result.spreadsheetId).toBe('abc123');
    });
  });
});