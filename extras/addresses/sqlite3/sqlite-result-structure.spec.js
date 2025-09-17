/**
 * SQLite Result Structure Test
 * Explores the actual return structure from sqlite3 library in JavaScript
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const sqlite3 = require('sqlite3').verbose();

describe('SQLite Library JavaScript Return Structure', () => {
  let db;
  
  beforeEach(() => {
    // Create an in-memory database for testing
    db = new sqlite3.Database(':memory:');
  });
  
  afterEach(() => {
    db.close();
  });

  describe('Raw SQLite3 Library Returns', () => {
    test('should examine raw return from db.run() CREATE TABLE', (done) => {
      db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT NOT NULL)", function(err) {
        console.log('CREATE TABLE callback - err:', err);
        console.log('CREATE TABLE callback - this.changes:', this.changes);
        console.log('CREATE TABLE callback - this.lastID:', this.lastID);
        
        expect(err).toBeNull();
        expect(typeof this.changes).toBe('number');
        expect(typeof this.lastID).toBe('number');
        done();
      });
    });

    test('should examine raw return from db.run() INSERT', (done) => {
      // First create table
      db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT NOT NULL)", () => {
        // Then insert data
        db.run("INSERT INTO test (name) VALUES ('alice')", function(err) {
          console.log('INSERT callback - err:', err);
          console.log('INSERT callback - this.changes:', this.changes);
          console.log('INSERT callback - this.lastID:', this.lastID);
          
          expect(err).toBeNull();
          expect(this.changes).toBe(1); // Should affect 1 row
          expect(this.lastID).toBe(1);  // Should be first inserted ID
          done();
        });
      });
    });

    test('should examine raw return from db.all() SELECT - THIS IS THE KEY TEST', (done) => {
      // Setup: create table and insert data
      db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT NOT NULL)", () => {
        db.run("INSERT INTO test (name) VALUES ('alice')", () => {
          db.run("INSERT INTO test (name) VALUES ('bob')", () => {
            
            // The critical test: examine what db.all() returns
            db.all("SELECT * FROM test", (err, rows) => {
              console.log('=== CRITICAL: db.all() SELECT callback ===');
              console.log('SELECT callback - err:', err);
              console.log('SELECT callback - rows type:', typeof rows);
              console.log('SELECT callback - rows is array:', Array.isArray(rows));
              console.log('SELECT callback - rows length:', rows?.length);
              console.log('SELECT callback - rows structure:', JSON.stringify(rows, null, 2));
              
              if (rows && rows.length > 0) {
                console.log('First row type:', typeof rows[0]);
                console.log('First row keys:', Object.keys(rows[0]));
                console.log('First row.id:', rows[0].id, typeof rows[0].id);
                console.log('First row.name:', rows[0].name, typeof rows[0].name);
              }
              
              // Expectations about the return structure
              expect(err).toBeNull();
              expect(Array.isArray(rows)).toBe(true);
              expect(rows.length).toBe(2);
              expect(typeof rows[0]).toBe('object');
              expect(rows[0]).toHaveProperty('id');
              expect(rows[0]).toHaveProperty('name');
              expect(rows[0].name).toBe('alice');
              expect(rows[1].name).toBe('bob');
              
              done();
            });
          });
        });
      });
    });

    test('should examine what happens in a DO OVER simulation', (done) => {
      // Setup data
      db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT NOT NULL)", () => {
        db.run("INSERT INTO test (name) VALUES ('alice')", () => {
          db.run("INSERT INTO test (name) VALUES ('bob')", () => {
            
            db.all("SELECT * FROM test", (err, rows) => {
              console.log('=== SIMULATING DO OVER LOOP ===');
              
              // Simulate what happens in a DO OVER loop
              for (let i = 0; i < rows.length; i++) {
                const test_row = rows[i];
                console.log(`Loop iteration ${i}:`);
                console.log('  test_row:', test_row);
                console.log('  test_row type:', typeof test_row);
                console.log('  test_row.id:', test_row.id, typeof test_row.id);
                console.log('  test_row.name:', test_row.name, typeof test_row.name);
                
                // Test property access like in Rexx
                const row_id = test_row.id;
                const row_name = test_row.name;
                console.log('  Extracted - id:', row_id, 'name:', row_name);
              }
              
              expect(rows.length).toBe(2);
              done();
            });
          });
        });
      });
    });
  });
});