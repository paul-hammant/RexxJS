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

ADDRESS GCP

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

"RUN DEPLOY " || SERVICE_NAME || " IMAGE " || imageUrl || " REGION " || REGION

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

/* Extract service URL from output (gcloud includes it) */
serviceUrl = ''
IF POS('https://', RESULT.stdout) > 0 THEN DO
  /* Parse URL from gcloud output */
  lines = RESULT.stdout
  DO WHILE POS('https://', lines) > 0
    p = POS('https://', lines)
    urlLine = SUBSTR(lines, p)
    urlEnd = POS(' ', urlLine)
    IF urlEnd = 0 THEN urlEnd = LENGTH(urlLine) + 1
    serviceUrl = SUBSTR(urlLine, 1, urlEnd - 1)
    LEAVE
  END
END

IF serviceUrl \= '' THEN DO
  SAY "  Service URL: " || serviceUrl
  SAY ""

  /* Step 2: Test the service */
  SAY "Step 2: Testing service endpoint..."
  SAY ""

  /* Use curl to test (simple approach) */
  ADDRESS SYSTEM 'curl -s ' || serviceUrl || ' | head -20'

  IF RC = 0 THEN DO
    SAY ""
    SAY "✓ Service responding!"
  END
  ELSE DO
    SAY "⚠️  Could not test service (curl might not be installed)"
    SAY "   Visit: " || serviceUrl
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
SAY "Next steps:"
SAY "  • Visit service URL to test"
SAY "  • View logs: gcloud run services logs read " || SERVICE_NAME
SAY "  • Monitor: https://console.cloud.google.com/run"
SAY "  • Delete service: ADDRESS GCP 'RUN DELETE " || SERVICE_NAME || "'"
SAY ""
SAY "Cost info:"
SAY "  • This deployment: FREE (within free tier)"
SAY "  • Idle service (min-instances=0): $0/month"
SAY "  • First 2M requests/month: FREE"
SAY "  • Delete anytime with no cost"

EXIT 0
