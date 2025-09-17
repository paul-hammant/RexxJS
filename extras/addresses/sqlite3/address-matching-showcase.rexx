#!/usr/bin/env ../../../core/rexxt

// SQLite3 ADDRESS MATCHING Showcase - Terse & Elegant
// Demonstrates the power of multiline SQL with RexxJS
// Copyright (c) 2025 Paul Hammant

REQUIRE "../../../core/src/expectations-address.js"
REQUIRE "./sqlite-address.js"

SAY "🗄️ SQLite3 ADDRESS MATCHING Showcase"
SAY ""

// Elegant table creation with constraints
ADDRESS sqlite3 MATCHING("  (.*)")

  CREATE TABLE library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT DEFAULT 'Fiction',
    pages INTEGER CHECK(pages > 0),
    rating REAL CHECK(rating >= 1.0 AND rating <= 5.0)
  )

SAY "✓ Library table created"

// Terse batch data insertion
ADDRESS sqlite3 MATCHING("  (.*)")

  INSERT INTO library (title, author, genre, pages, rating) VALUES
    ('1984', 'George Orwell', 'Dystopian', 328, 4.8),
    ('Dune', 'Frank Herbert', 'Science Fiction', 688, 4.7),
    ('Pride and Prejudice', 'Jane Austen', 'Romance', 432, 4.5)

SAY "✓ " || RESULT.rowsAffected || " books added to library"

// Elegant query with all data
ADDRESS sqlite3 MATCHING("  (.*)")

  SELECT * FROM library ORDER BY rating DESC

SAY "✓ Retrieved " || RESULT.count || " books"
SAY ""
SAY "📚 Library Collection:"

DO book OVER RESULT.rows
  SAY "  " || book.id || ". " || book.title || " by " || book.author
  SAY "     Genre: " || book.genre || " | Pages: " || book.pages || " | Rating: " || book.rating || "/5"
  SAY ""
END

// Elegant cleanup
ADDRESS sqlite3 MATCHING("  (.*)")

  DROP TABLE library

SAY "✓ Library table cleaned up"
SAY ""
SAY "🎯 ADDRESS MATCHING Showcase Complete!"
SAY "✨ Multiline SQL made elegant with RexxJS"