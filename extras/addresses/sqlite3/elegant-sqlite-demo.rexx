#!/usr/bin/env ../../../core/rexxt

// Elegant SQLite3 Demo - Terse, Multiline ADDRESS HEREDOC
// Copyright (c) 2025 Paul Hammant

REQUIRE "../../../core/src/expectations-address.js"
REQUIRE "./sqlite-address.js"

SAY "🗄️ Elegant SQLite3 with ADDRESS HEREDOC"

// Terse table creation
ADDRESS sqlite3
<<CREATE_USERS
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
)
CREATE_USERS

SAY "✓ Table created"

// Elegant data insertion  
ADDRESS sqlite3
<<INSERT_USERS
INSERT INTO users (name, email) VALUES
  ('Alice Smith', 'alice@example.com'),
  ('Bob Jones', 'bob@example.com'),
  ('Carol Brown', 'carol@example.com')
INSERT_USERS

SAY "✓ Data inserted: " || RESULT.rowsAffected || " rows"

// Beautiful query with joins (multiline)
ADDRESS sqlite3
<<SELECT_USERS
SELECT 
  id,
  name,
  email,
  LENGTH(name) as name_length
FROM users 
WHERE name_length > 8
ORDER BY name
SELECT_USERS

SAY "✓ Query executed, found " || RESULT.count || " users"

// Elegant iteration through results
DO user OVER RESULT.rows
  SAY "📧 " || user.name || " <" || user.email || "> [ID: " || user.id || "]"
END

SAY "🎯 Elegant SQLite demo complete!"