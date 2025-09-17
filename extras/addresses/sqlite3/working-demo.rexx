#!/usr/bin/env ../../../core/rexxt

// Working SQLite3 ADDRESS MATCHING Demo
// Copyright (c) 2025 Paul Hammant

REQUIRE "../../../core/src/expectations-address.js" 
REQUIRE "./sqlite-address.js"

SAY "🗄️ Working SQLite3 ADDRESS MATCHING Demo"

// Simple table creation
ADDRESS sqlite3 MATCHING("  (.*)")

  CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT, price REAL)

SAY "✓ Table created: " || RESULT.operation

// Simple insert
ADDRESS sqlite3 MATCHING("  (.*)")

  INSERT INTO items (name, price) VALUES ('Apple', 1.50)

SAY "✓ First item inserted"

// Another insert
ADDRESS sqlite3 MATCHING("  (.*)")

  INSERT INTO items (name, price) VALUES ('Banana', 0.75)

SAY "✓ Second item inserted"

// Simple select
ADDRESS sqlite3 MATCHING("  (.*)")

  SELECT * FROM items

SAY "✓ Query executed, found " || RESULT.count || " items"

// Simple iteration
DO item OVER RESULT.rows
  SAY "  🛒 " || item.name || " costs $" || item.price || " (ID: " || item.id || ")"
END

SAY "🎯 Demo successful - ADDRESS MATCHING working!"