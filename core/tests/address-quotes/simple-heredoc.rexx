-- Simple heredoc test
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License

REQUIRE "./src/sqlite-address.js"
ADDRESS sql

<<SIMPLE_SQL
CREATE TABLE simple_test (id INTEGER, name TEXT)
SIMPLE_SQL
SAY "RC:" RC