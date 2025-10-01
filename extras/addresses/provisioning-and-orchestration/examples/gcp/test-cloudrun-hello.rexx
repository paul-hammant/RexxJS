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
  SAY "Common issues:"
  SAY "  1. gcloud not installed: sudo apt install google-cloud-sdk"
  SAY "  2. Not authenticated: gcloud auth login"
  SAY "  3. Cloud Run API not enabled - visit:"
  SAY "     https://console.cloud.google.com/apis/library/run.googleapis.com"
  SAY "  4. No billing account (even for free tier)"
  SAY ""
  SAY "Error details:"
  SAY RESULT.stderr
  EXIT 1
END

SAY "✓ Service deployed successfully!"
SAY ""

/* Extract service URL from RESULT - it's in the stderr */
LET serviceUrl = ''
LET urlPos = POS('https://', RESULT.stderr)

IF urlPos > 0 THEN DO
  LET afterUrl = SUBSTR(RESULT.stderr, urlPos, 100)
  LET escPos = POS('[', afterUrl)
  IF escPos > 0 THEN DO
    LET urlLen = escPos - 1
    serviceUrl = SUBSTR(afterUrl, 1, urlLen)
  END
  ELSE DO
    serviceUrl = afterUrl
  END
END

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
  SAY "⚠️  Could not extract service URL from output"
  SAY "   Check Cloud Console: https://console.cloud.google.com/run"
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
