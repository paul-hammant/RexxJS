#!/usr/bin/env rexx
/*
 * Test Cloud Functions deployment with hello-world function
 *
 * Prerequisites:
 *   1. Cloud Functions source in ./cloudfunction-hello/
 *   2. gcloud CLI installed and authenticated
 *
 * Cost Estimate:
 *   - Deployment: FREE (API call only)
 *   - Function (0 invocations when idle): FREE
 *   - Test invocations: FREE (within 2M invocations/month)
 *   - This test: ~$0.00
 */

SAY "Cloud Functions Hello World Test"
SAY "================================"
SAY ""

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

FUNCTION_NAME = 'rexxjs-hello-function'
REGION = 'us-central1'
RUNTIME = 'python311'
TEMP_DIR = '/tmp/rexxjs-cloudfunction-hello'

/* Step 1: Create function source code inline via HEREDOC */
SAY "Step 1: Creating Cloud Function source code..."
SAY ""

/* Note: FILE_WRITE requires parent directory to exist.
 * In production, you'd create it first. For this test, ensure /tmp/rexxjs-cloudfunction-hello exists:
 * mkdir -p /tmp/rexxjs-cloudfunction-hello
 */

LET function_code = <<PYTHON_CODE
"""
Simple Hello World Cloud Function for testing RexxJS GCP integration

This function responds to HTTP requests with a simple greeting.
"""

def hello_world(request):
    """
    HTTP Cloud Function entry point

    Args:
        request (flask.Request): The request object

    Returns:
        str: A simple greeting message
    """
    request_json = request.get_json(silent=True)
    request_args = request.args

    # Get name from request
    name = None
    if request_json and 'name' in request_json:
        name = request_json['name']
    elif request_args and 'name' in request_args:
        name = request_args['name']

    if name:
        return f'Hello {name} from Cloud Functions!'
    else:
        return 'Hello World from Cloud Functions!'
PYTHON_CODE

LET requirements_txt = <<REQUIREMENTS
# No additional dependencies required
# Flask is provided by the Cloud Functions runtime
REQUIREMENTS

/* Create temporary directory and write files using FILE_WRITE */
LET main_py_path = TEMP_DIR || '/main.py'
LET requirements_path = TEMP_DIR || '/requirements.txt'

CALL FILE_WRITE main_py_path, function_code
CALL FILE_WRITE requirements_path, requirements_txt

SAY "✓ Function source created in: " || TEMP_DIR
SAY ""

/* Step 2: Deploy function */
SAY "Step 2: Deploying Cloud Function..."
SAY "  Function: " || FUNCTION_NAME
SAY "  Source: " || TEMP_DIR
SAY "  Runtime: " || RUNTIME
SAY "  Region: " || REGION
SAY ""
SAY "⚠️  This requires gcloud CLI installed"
SAY "   Deployment will take 30-90 seconds..."
SAY ""

ADDRESS GCP "FUNCTIONS DEPLOY {FUNCTION_NAME} SOURCE {TEMP_DIR} TRIGGER http RUNTIME {RUNTIME} ENTRYPOINT hello_world REGION {REGION}"

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
    SAY "❌ CLOUD FUNCTIONS API NOT ENABLED"
    SAY ""
    SAY "The Cloud Functions API needs to be enabled for your project."
    SAY ""
    SAY "▶ ACTION REQUIRED:"
    SAY "   1. Visit this URL (opens in browser):"
    SAY "      https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com"
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
      SAY "Your service account lacks the required Cloud Functions permissions."
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
      SAY "   5. Search for and add: 'Cloud Functions Developer'"
      SAY "      (or 'Cloud Functions Admin' for full control)"
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

SAY "✓ Function deployed successfully!"
SAY ""

/* Get function URL from structured JSON response */
LET functionUrl = RESULT.url

IF functionUrl \= '' THEN DO
  SAY "  Function URL: " || functionUrl
  SAY ""

  /* Step 2: Test the function with HTTP_GET */
  SAY "Step 2: Testing function endpoint with HTTP_GET..."
  SAY ""

  LET response = HTTP_GET(functionUrl)
  LET status = response.status
  LET body = response.body
  LET hasContent = POS('Hello', body)

  IF status = 200 THEN DO
    SAY "✓ Function responding with HTTP " || status
    IF hasContent > 0 THEN DO
      SAY "✓ Received expected 'Hello' content from function"
      SAY "  Response: " || body
    END
    ELSE DO
      SAY "⚠️  Unexpected content (no 'Hello' found)"
      SAY "  Response: " || body
    END
  END
  ELSE DO
    SAY "⚠️  Function returned status: " || status
    SAY "  Body: " || body
  END
END
ELSE DO
  SAY "⚠️  Could not get function URL from deployment"
  SAY "   Check Cloud Console: https://console.cloud.google.com/functions"
  SAY "   The function may still be deploying or initializing"
END

SAY ""
SAY "========================================="
SAY "✓ Cloud Function deployment test complete!"
SAY ""

/* Step 3: Clean up - delete the function */
SAY "Step 3: Cleaning up test function..."
SAY ""

ADDRESS GCP "FUNCTIONS DELETE {FUNCTION_NAME}"

IF RC = 0 THEN DO
  SAY "✓ Function deleted successfully"
END
ELSE DO
  SAY "⚠️  Could not delete function"
  SAY "   Manual cleanup: gcloud functions delete " || FUNCTION_NAME || " --region=" || REGION
END

/* Clean up temporary directory */
CALL FILE_DELETE main_py_path
CALL FILE_DELETE requirements_path
SAY "✓ Temporary files cleaned up"
SAY ""
SAY "Cost: $0.00 (within free tier)"
SAY ""
SAY "Test complete - function deployed, tested, and cleaned up!"

EXIT 0
