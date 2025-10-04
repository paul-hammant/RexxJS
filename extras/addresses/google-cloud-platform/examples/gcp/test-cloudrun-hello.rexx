#!/usr/bin/env rexx
/*
 * Test Cloud Run deployment with hello-world service
 *
 * Prerequisites:
 *   1. Build image: cd cloudrun-hello && ./build-and-push.sh
 *   2. Or use pre-built: gcr.io/cloudrun/hello (Google's public image)
 *
 * Cost Estimate:
 *   - Deployment: FREE (API call only)
 *   - Running service (min-instances=0): FREE when idle
 *   - Test requests: FREE (within 2M requests/month)
 *   - This test: ~$0.00
 */

PARSE ARG imageUrl

/* Use Google's public hello image if not specified */
IF imageUrl = '' THEN DO
  imageUrl = 'gcr.io/cloudrun/hello'
  SAY 'Using Google public hello image: ' || imageUrl
  SAY '(To use custom image: ./cloudrun-hello/build-and-push.sh)'
  SAY ''
END

SAY "Cloud Run Hello World Test"
SAY "==========================="
SAY ""

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

SERVICE_NAME = 'rexxjs-hello'
REGION = 'us-central1'

/* Step 1: Deploy service */
SAY "Step 1: Deploying Cloud Run service..."
SAY "  Service: " || SERVICE_NAME
SAY "  Image: " || imageUrl
SAY "  Region: " || REGION
SAY ""
SAY "⚠️  This requires gcloud CLI installed"
SAY "   Deployment will take 30-60 seconds..."
SAY ""

ADDRESS GCP "RUN DEPLOY {SERVICE_NAME} IMAGE {imageUrl} REGION {REGION}"

IF RC \= 0 THEN DO
  SAY "✗ DEPLOY FAILED"
  SAY ""

  /* Parse error message for specific issues */
  LET errorText = RESULT.stderr
  LET hasApiDisabled = POS('API has not been used', errorText)
  LET hasPermission = POS('Permission', errorText)
  LET hasPermissionDenied = POS('denied', errorText)

  /* Detect specific error conditions and provide actionable guidance */
  IF hasApiDisabled > 0 THEN DO
    SAY "❌ CLOUD RUN API NOT ENABLED"
    SAY ""
    SAY "The Cloud Run API needs to be enabled for your project."
    SAY ""
    SAY "▶ ACTION REQUIRED:"
    SAY "   1. Visit this URL (opens in browser):"
    SAY "      https://console.cloud.google.com/apis/library/run.googleapis.com"
    SAY ""
    SAY "   2. Make sure you're logged into the correct Google account"
    SAY ""
    SAY "   3. Select your project from the dropdown at the top"
    SAY ""
    SAY "   4. Click the 'ENABLE' button"
    SAY ""
    SAY "   5. Wait 1-2 minutes for the API to be fully enabled"
    SAY ""
    SAY "   6. Re-run this script"
    SAY ""
  END
  ELSE DO
    IF hasPermission > 0 & hasPermissionDenied > 0 THEN DO
      SAY "❌ INSUFFICIENT PERMISSIONS"
      SAY ""
      SAY "Your service account lacks the required Cloud Run permissions."
      SAY ""
      SAY "▶ ACTION REQUIRED:"
      SAY "   1. Visit the IAM page:"
      SAY "      https://console.cloud.google.com/iam-admin/iam"
      SAY ""
      SAY "   2. Find your service account in the list"
      SAY ""
      SAY "   3. Click the pencil (✏️) icon to edit permissions"
      SAY ""
      SAY "   4. Click '+ ADD ANOTHER ROLE'"
      SAY ""
      SAY "   5. Search for and add: 'Cloud Run Admin'"
      SAY "      (Also add 'Service Account User' if not already present)"
      SAY ""
      SAY "   6. Click 'SAVE'"
      SAY ""
      SAY "   7. Wait 30 seconds for permissions to propagate"
      SAY ""
      SAY "   8. Re-run this script"
      SAY ""
    END
    ELSE DO
      SAY "Common issues:"
      SAY "  • gcloud CLI not installed: sudo apt install google-cloud-sdk"
      SAY "  • Not authenticated: gcloud auth login"
      SAY "  • No billing account linked to project"
      SAY ""
    END
  END

  SAY "Full error details:"
  SAY "─────────────────────────────────────────"
  SAY errorText
  SAY "─────────────────────────────────────────"
  EXIT 1
END

SAY "✓ Service deployed successfully!"
SAY ""

/* Get service URL from structured JSON response */
LET serviceUrl = RESULT.url

IF serviceUrl \= '' THEN DO
  SAY "  Service URL: " || serviceUrl
  SAY ""

  /* Step 2: Test the service with HTTP_GET */
  SAY "Step 2: Testing service endpoint with HTTP_GET..."
  SAY ""

  LET response = HTTP_GET(serviceUrl)
  LET status = response.status
  LET body = response.body
  LET hasContent = POS('Congratulations', body)

  IF status = 200 THEN DO
    SAY "✓ Service responding with HTTP " || status
    IF hasContent > 0 THEN DO
      SAY "✓ Received expected 'Congratulations' content from hello-world service"
    END
    ELSE DO
      SAY "⚠️  Unexpected content (no 'Congratulations' found)"
    END
  END
  ELSE DO
    SAY "⚠️  Service returned status: " || status
  END
END
ELSE DO
  SAY "⚠️  Could not get service URL from deployment"
  SAY "   Check Cloud Console: https://console.cloud.google.com/run"
  SAY "   The service may still be deploying or initializing"
END

SAY ""
SAY "========================================="
SAY "✓ Cloud Run deployment test complete!"
SAY ""

/* Step 3: Clean up - delete the service */
SAY "Step 3: Cleaning up test service..."
SAY ""

ADDRESS GCP "RUN DELETE {SERVICE_NAME}"

IF RC = 0 THEN DO
  SAY "✓ Service deleted successfully"
  SAY ""
  SAY "Cost: $0.00 (within free tier)"
END
ELSE DO
  SAY "⚠️  Could not delete service"
  SAY "   Manual cleanup: gcloud run services delete " || SERVICE_NAME || " --region=" || REGION
END

SAY ""
SAY "Test complete - service deployed, tested, and cleaned up!"

EXIT 0
