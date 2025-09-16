/*!
 * rexxjs/duckdb-wasm-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta {"namespace":"rexxjs","dependencies":{"@duckdb/duckdb-wasm":"^1.28.0"},"envVars":[]}
 */
/**
 * DuckDB-WASM ADDRESS Library - Provides an in-process analytical database via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 *
 * Usage:
 *   REQUIRE "duckdb-wasm-address"
 *   ADDRESS DUCKDB
 *   LET result = query sql="SELECT 42;"
 *
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

let duckdb = null;
try {
  if (typeof require !== 'undefined') {
    duckdb = require('@duckdb/duckdb-wasm');
  } else if (typeof window !== 'undefined' && window.duckdb) {
    duckdb = window.duckdb;
  }
} catch (e) {
  // DuckDB-WASM is expected to be loaded externally
}

let dbInstance = null;
let dbLoadingPromise = null;
let dbConnection = null;

async function getDb() {
    if (dbInstance) {
        return dbInstance;
    }

    if (dbLoadingPromise) {
        return dbLoadingPromise;
    }

    if (!duckdb) {
        throw new Error('DuckDB-WASM is not loaded. Make sure to include it in your environment.');
    }

    console.log("Loading DuckDB-WASM...");
    dbLoadingPromise = (async () => {
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        return db;
    })();

    dbInstance = await dbLoadingPromise;
    console.log("DuckDB-WASM loaded successfully.");
    dbLoadingPromise = null;
    return dbInstance;
}

async function getConnection() {
    if (dbConnection) {
        return dbConnection;
    }
    const db = await getDb();
    dbConnection = await db.connect();
    return dbConnection;
}

function DUCKDB_WASM_ADDRESS_MAIN() {
    return {
        type: 'address-target',
        name: 'DuckDB-WASM Service',
        version: '1.0.0',
        description: 'In-process analytical database via DuckDB-WASM',
        provides: {
            addressTarget: 'duckdb',
            handlerFunction: 'ADDRESS_DUCKDB_WASM_HANDLER',
            commandSupport: true,
            methodSupport: true
        },
        dependencies: ['@duckdb/duckdb-wasm@^1.28.0'],
        loaded: true,
        requirements: {
            environment: 'browser',
            modules: ['@duckdb/duckdb-wasm']
        },
        duckdbAvailable: !!duckdb
    };
}

async function ADDRESS_DUCKDB_WASM_HANDLER(method, params) {
    try {
        const c = await getConnection();
        let result;

        if (typeof method === 'string' && !params) {
            result = await c.query(method);
            return { success: true, result: result.toArray().map(row => row.toJSON()), output: "Query successful" };
        }

        switch (method.toLowerCase()) {
            case 'query':
                const sql = params.sql || params.query;
                if (typeof sql !== 'string') {
                    throw new Error('The "sql" parameter must be a string.');
                }
                result = await c.query(sql);
                const resultArray = result.toArray().map(row => row.toJSON());
                return { success: true, result: resultArray, output: JSON.stringify(resultArray) };

            case 'status':
                const db = await getDb();
                return {
                    success: true,
                    result: {
                        version: await db.getVersion(),
                        featureFlags: await db.getFeatureFlags(),
                        connection: dbConnection ? 'connected' : 'disconnected'
                    }
                };

            case 'register_file_url':
                const { url, name, protocol } = params;
                const db_reg = await getDb();
                await db_reg.registerFileURL(name, url, protocol || duckdb.DuckDBDataProtocol.HTTP, false);
                return { success: true, output: `File '${name}' registered from URL.` };

            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    } catch (error) {
        return {
            success: false,
            result: null,
            error: error.message,
            output: '',
            errorMessage: error.message,
            errorCode: 1,
        };
    }
}

const ADDRESS_DUCKDB_WASM_METHODS = {
    query: {
        description: "Execute a SQL query.",
        params: ["sql"],
        returns: "The result of the query as an array of objects."
    },
    status: {
        description: "Get the status of the DuckDB service.",
        params: [],
        returns: "An object with status information."
    },
    register_file_url: {
        description: "Register a file from a URL.",
        params: ["name", "url", "protocol"],
        returns: "Status message."
    }
};

if (typeof window !== 'undefined') {
    window.DUCKDB_WASM_ADDRESS_MAIN = DUCKDB_WASM_ADDRESS_MAIN;
    window.ADDRESS_DUCKDB_WASM_HANDLER = ADDRESS_DUCKDB_WASM_HANDLER;
    window.ADDRESS_DUCKDB_WASM_METHODS = ADDRESS_DUCKDB_WASM_METHODS;
} else if (typeof global !== 'undefined') {
    global.DUCKDB_WASM_ADDRESS_MAIN = DUCKDB_WASM_ADDRESS_MAIN;
    global.ADDRESS_DUCKDB_WASM_HANDLER = ADDRESS_DUCKDB_WASM_HANDLER;
    global.ADDRESS_DUCKDB_WASM_METHODS = ADDRESS_DUCKDB_WASM_METHODS;
}
