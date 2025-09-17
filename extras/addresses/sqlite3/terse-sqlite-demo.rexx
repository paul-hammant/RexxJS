#!/usr/bin/env ../../../core/rexxt

// Terse SQLite3 Demo - Elegant Multiline Patterns
// Copyright (c) 2025 Paul Hammant

REQUIRE "../../../core/src/expectations-address.js"  
REQUIRE "./sqlite-address.js"

SAY "🗄️ Terse SQLite3 Demo"

// CREATE TABLE - multiline elegance
ADDRESS sqlite3 MATCHING("  (.*)")

  CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL
  )

SAY "✓ Table: " || RESULT.operation

// INSERT - clean multiline data
ADDRESS sqlite3 MATCHING("  (.*)")

  INSERT INTO products (name, price) 
  VALUES ('Widget', 29.99)

ADDRESS sqlite3 MATCHING("  (.*)")

  INSERT INTO products (name, price)
  VALUES ('Gadget', 19.99)  

SAY "✓ Inserted " || RESULT.rowsAffected || " rows"

// SELECT with elegant results
ADDRESS sqlite3 MATCHING("  (.*)")

  SELECT * FROM products

SAY "✓ Found " || RESULT.count || " products"

// Terse iteration  
DO item OVER RESULT.rows
  SAY "  📦 " || item.name || " - $" || item.price
END

SAY "🎯 Terse demo complete!"