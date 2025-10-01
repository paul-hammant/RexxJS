#!/usr/bin/env rexx
/* Quick test for AppsScriptHandler refactoring */

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Testing AppsScriptHandler extraction..."
"APPS_SCRIPT INFO"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ AppsScriptHandler INFO command working"
SAY "  Service: " || RESULT.service
SAY "  Version: " || RESULT.version
EXIT 0
