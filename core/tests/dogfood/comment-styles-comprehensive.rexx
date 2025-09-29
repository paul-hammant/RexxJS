#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags comments, syntax, comprehensive, dogfood */
/* @description Comprehensive Comment Styles Test - All comment types */

REQUIRE "./core/src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Comment Styles Test Suite Starting..."
SAY "💬 Testing all comment types: --, //, /* */"

-- This is a double-dash comment
LET dash_comment_works = "yes"

// This is a double-slash comment  
LET slash_comment_works = "yes"

/* This is a block comment */
LET block_comment_works = "yes"

/* Multi-word block comment with spaces */
LET multi_word_block = "yes"

/* 
 * Multi-line block comment
 * with asterisks for style
 */
LET multi_line_planned = "future"

-- Another dash comment with code after
LET after_dash = "works" -- inline dash comment (if supported)

// Another slash comment with code after  
LET after_slash = "works" // inline slash comment (if supported)

/* Testing edge cases */
LET edge_test = "/* not a comment inside quotes */"
LET another_edge = "// also not a comment"
LET dash_edge = "-- definitely not a comment"

ADDRESS EXPECTATIONS
<<EXPECTATIONS
{dash_comment_works} should equal "yes"
{slash_comment_works} should equal "yes" 
{block_comment_works} should equal "yes"
{multi_word_block} should equal "yes"
{edge_test} should equal "/* not a comment inside quotes */"
{another_edge} should equal "// also not a comment"
{dash_edge} should equal "-- definitely not a comment"
EXPECTATIONS

SAY "✅ Comment Styles Tests Complete"
SAY "📝 Successfully tested: dash(--), slash(//), block(/* */)"
EXIT 0

/* Final block comment at end of file */