/* Test REQUIRE with root: prefix */
SAY "Testing REQUIRE with root: prefix..."

/* This should load from project root */
REQUIRE "root:core/src/expectations-address.js"
SAY "Successfully loaded with root: prefix!"
