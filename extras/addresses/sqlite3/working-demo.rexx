#!/usr/bin/env ../../../core/rexxt

// Working SQLite3 ADDRESS HEREDOC Demo
// Copyright (c) 2025 Paul Hammant

REQUIRE "../../../core/src/expectations-address.js" 
REQUIRE "./sqlite-address.js"

SAY "🗄️ Working SQLite3 ADDRESS HEREDOC Demo"

// Simple table creation
ADDRESS sqlite3
<<CREATE_TABLE
CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT, price REAL)
CREATE_TABLE

SAY "✓ Table created: " || RESULT.operation

// Simple insert
ADDRESS sqlite3
<<INSERT_APPLE
INSERT INTO items (name, price) VALUES ('Apple', 1.50)
INSERT_APPLE

SAY "✓ First item inserted"

// Another insert
ADDRESS sqlite3
<<INSERT_BANANA
INSERT INTO items (name, price) VALUES ('Banana', 0.75)
INSERT_BANANA

SAY "✓ Second item inserted"

// Simple select
ADDRESS sqlite3
<<SELECT_ITEMS
SELECT * FROM items
SELECT_ITEMS

SAY "✓ Query executed, found " || RESULT.count || " items"

// Simple iteration
DO item OVER RESULT.rows
  SAY "  🛒 " || item.name || " costs $" || item.price || " (ID: " || item.id || ")"
END

SAY "🎯 Demo successful - ADDRESS HEREDOC working!"