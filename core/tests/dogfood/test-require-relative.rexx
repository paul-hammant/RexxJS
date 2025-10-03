/* Test REQUIRE with relative path resolution */
SAY "Testing REQUIRE with relative path..."

/* This should load from core/src/ directory (up two levels from tests/dogfood/) */
REQUIRE "../../src/expectations-address.js"
SAY "Successfully loaded expectations-address.js with relative path!"
