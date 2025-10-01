#!/usr/bin/env rexx
/*
 * OAuth2 Authorization for Apps Script API
 * Run this once to authorize RexxJS to access Apps Script API
 */

SAY "Apps Script OAuth2 Authorization"
SAY "=================================="
SAY ""

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Checking OAuth2 status..."
"APPS_SCRIPT INFO"

IF RC = 0 THEN DO
  SAY "  Credentials exist: " || RESULT.oauth2.credentialsExist
  SAY "  Token exists: " || RESULT.oauth2.tokenExists
  SAY "  Ready to use: " || RESULT.oauth2.ready
  SAY ""

  IF RESULT.oauth2.ready = "true" THEN DO
    SAY "✓ Already authorized! You can use Apps Script API."
    EXIT 0
  END

  IF RESULT.oauth2.credentialsExist = "false" THEN DO
    SAY "✗ OAuth2 credentials file not found"
    SAY ""
    SAY "Please create OAuth2 credentials:"
    SAY "1. Visit: https://console.cloud.google.com/apis/credentials?project=tribal-quasar-473615-a4"
    SAY "2. Click 'Create Credentials' → 'OAuth client ID'"
    SAY "3. Choose 'Desktop app'"
    SAY "4. Download the JSON file"
    SAY "5. Save it as: oauth2-client-credentials.json"
    EXIT 1
  END
END

SAY "Step 2: Starting OAuth2 authorization..."
SAY ""
SAY "A browser window will open for you to authorize access."
SAY "After authorization, return to this terminal."
SAY ""

"APPS_SCRIPT AUTHORIZE"

IF RC = 0 THEN DO
  SAY ""
  SAY "✓ " || RESULT.message
  IF RESULT.note \= '' THEN SAY "  " || RESULT.note
  SAY ""
  SAY "✅ Authorization complete! You can now run Apps Script commands."
END
ELSE DO
  SAY ""
  SAY "✗ Authorization failed"
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

EXIT 0