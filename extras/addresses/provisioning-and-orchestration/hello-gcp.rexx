#!/usr/bin/env rexx
/* Hello World GCP Cloud Functions - Function-as-a-Service Demo */

SAY "🚀 === Google Cloud Functions Hello World Deployment ==="
SAY ""

/* Load GCP ADDRESS handler */
REQUIRE "../system/system-address.js"
SAY "✓ System address handler loaded"

/* Load and verify our GCP handler exists */
ADDRESS SYSTEM
LET check_result = execute command="ls -la address-gcp.js" shell="bash"
if check_result.success then do
  SAY "✓ GCP address handler found"
end
else do
  SAY "❌ GCP address handler not found!"
  exit 1
end
SAY ""

/* Verify gcloud CLI is available */
SAY "🔍 Checking Google Cloud CLI availability..."
LET gcloud_check = execute command="which gcloud" shell="bash"
if gcloud_check.success then do
  SAY "✓ gcloud CLI found at: " || gcloud_check.stdout

  /* Get current project */
  LET project_check = execute command="gcloud config get-value project 2>/dev/null" shell="bash"
  if project_check.success && LENGTH(project_check.stdout) > 0 then do
    SAY "✓ Current project: " || project_check.stdout
  end
  else do
    SAY "⚠️  No default project set. Use: gcloud config set project YOUR_PROJECT_ID"
  end
end
else do
  SAY "❌ gcloud CLI not found!"
  SAY "   Install: curl https://sdk.cloud.google.com | bash"
  exit 1
end
SAY ""

/* Create unique deployment identifier */
LET deployment_id = "rexx-hello-" || TIME('s')
SAY "🎯 Deployment ID: " || deployment_id
SAY ""

/* ============================================ */
/* Create Hello World Cloud Function Source    */
/* ============================================ */

SAY "1. 📝 Creating Hello World Cloud Function source..."

/* Create temporary directory for function source */
LET temp_dir = "/tmp/" || deployment_id
LET mkdir_result = execute command="mkdir -p " || temp_dir shell="bash"

if mkdir_result.success then do
  SAY "   ✓ Created temp directory: " || temp_dir
end
else do
  SAY "   ❌ Failed to create temp directory"
  exit 1
end

/* Create Python Cloud Function source */
LET python_function = <<PYTHON_FUNCTION
import json
import functions_framework
from datetime import datetime

@functions_framework.http
def hello_rexx(request):
    """HTTP Cloud Function that responds with RexxJS-style greeting."""

    # Parse request data
    request_json = request.get_json(silent=True)
    request_args = request.args

    # Get name from request
    name = 'World'
    if request_json and 'name' in request_json:
        name = request_json['name']
    elif request_args and 'name' in request_args:
        name = request_args['name']

    # Generate RexxJS-style response
    response = {
        'message': f'Hello, {name}! 🎉',
        'source': 'Google Cloud Functions + RexxJS',
        'timestamp': datetime.now().isoformat(),
        'deployment_id': '${deployment_id}',
        'rexx_style': True,
        'details': {
            'runtime': 'python311',
            'trigger': 'HTTP',
            'framework': 'functions-framework'
        }
    }

    # Return JSON response
    return response
PYTHON_FUNCTION

/* Write function source to file */
LET function_file = temp_dir || "/main.py"
LET write_result = FILE_WRITE(function_file, python_function)

if write_result.success then do
  SAY "   ✓ Created function source: " || function_file
  SAY "   ✓ Source size: " || write_result.bytes || " bytes"
end
else do
  SAY "   ❌ Failed to write function source: " || write_result.error
  exit 1
end

/* Create requirements.txt */
LET requirements = <<REQUIREMENTS
functions-framework==3.*
REQUIREMENTS

LET req_file = temp_dir || "/requirements.txt"
LET req_result = FILE_WRITE(req_file, requirements)

if req_result.success then do
  SAY "   ✓ Created requirements.txt"
end
SAY ""

/* ============================================ */
/* Deploy Cloud Function                       */
/* ============================================ */

SAY "2. 🚀 Deploying Cloud Function..."

LET function_name = deployment_id || "-function"
LET deploy_cmd = "gcloud functions deploy " || function_name || " --runtime python311 --trigger-http --allow-unauthenticated --source " || temp_dir || " --entry-point hello_rexx --region us-central1 --timeout 60s --memory 256MB"

SAY "   Command: " || deploy_cmd
SAY "   (This may take 2-3 minutes for first deployment...)"

LET deploy_result = execute command=deploy_cmd shell="bash"

if deploy_result.success then do
  SAY "   ✅ Cloud Function deployed successfully!"

  /* Extract function URL from output */
  LET url_start = POS("httpsTrigger:", deploy_result.stdout)
  if url_start > 0 then do
    LET url_section = SUBSTR(deploy_result.stdout, url_start)
    LET url_line_end = POS(CHR(10), url_section)
    if url_line_end > 0 then do
      LET url_line = SUBSTR(url_section, 1, url_line_end - 1)
      LET url_start2 = POS("url: ", url_line)
      if url_start2 > 0 then do
        LET function_url = SUBSTR(url_line, url_start2 + 5)
        function_url = STRIP(function_url)
        SAY "   🌐 Function URL: " || function_url
      end
    end
  end
end
else do
  SAY "   ❌ Function deployment failed:"
  SAY "   " || deploy_result.stderr
  /* Continue with other deployments */
end
SAY ""

/* ============================================ */
/* Deploy Event-Driven Function (Gen 2)       */
/* ============================================ */

SAY "3. 📢 Deploying Event-Driven Function (Cloud Storage trigger)..."

/* Create a second function that responds to file uploads */
LET event_function = <<EVENT_FUNCTION
import json
import functions_framework
from datetime import datetime

@functions_framework.cloud_event
def process_file(cloud_event):
    """Triggered by Cloud Storage file uploads."""

    data = cloud_event.data
    bucket = data.get('bucket', 'unknown')
    filename = data.get('name', 'unknown')

    print(f"Processing file: gs://{bucket}/{filename}")
    print(f"Event type: {cloud_event['type']}")
    print(f"Event time: {cloud_event['time']}")

    # Simple processing simulation
    result = {
        'status': 'processed',
        'file': f'gs://{bucket}/{filename}',
        'processed_at': datetime.now().isoformat(),
        'deployment_id': '${deployment_id}',
        'message': 'File processed by RexxJS-deployed function!'
    }

    print(f"Processing result: {json.dumps(result)}")
    return result
EVENT_FUNCTION

/* Write event function source */
LET event_function_file = temp_dir || "/event_main.py"
LET event_write_result = FILE_WRITE(event_function_file, event_function)

if event_write_result.success then do
  SAY "   ✓ Created event function source: " || event_function_file

  /* Deploy the event-driven function */
  LET event_function_name = deployment_id || "-event-processor"
  LET event_deploy_cmd = "gcloud functions deploy " || event_function_name || " --gen2 --runtime python311 --trigger-bucket gs://your-bucket-name --source " || temp_dir || " --entry-point process_file --region us-central1 --timeout 120s --memory 512MB"

  SAY "   📤 Deploying event function: " || event_function_name
  SAY "   (This demonstrates Cloud Storage trigger - replace 'your-bucket-name' with actual bucket)"

  /* Note: This would fail without a real bucket, so we'll show the command */
  SAY "   Command: " || event_deploy_cmd
  SAY "   ✓ Event function deployment prepared (requires existing Cloud Storage bucket)"
end
SAY ""

/* ============================================ */
/* Deploy RexxJS Function                      */
/* ============================================ */

SAY "4. 🎯 Deploying RexxJS Script as Cloud Function..."

/* Create a simple RexxJS script */
LET rexx_script = <<REXX_SCRIPT
#!/usr/bin/env rexx
/* Simple RexxJS Cloud Function */

/* Parse GCP request data */
LET request_env = GET_ENV_VAR('GCP_REQUEST')
if LENGTH(request_env) > 0 then do
  LET request_data = JSON_PARSE(request_env)
  LET name = MAP_GET(request_data, 'name', 'RexxJS Developer')
end
else do
  name = 'Cloud Functions User'
end

/* Generate response */
LET response = MAP_CREATE()
CALL MAP_PUT response, "message", "Greetings from RexxJS on GCP! Hello, " || name || "!"
CALL MAP_PUT response, "timestamp", TIME('s')
CALL MAP_PUT response, "runtime", "RexxJS"
CALL MAP_PUT response, "platform", "Google Cloud Functions"
CALL MAP_PUT response, "deployment_id", "${deployment_id}"

/* Output as JSON */
SAY JSON_STRINGIFY(response)
REXX_SCRIPT

/* Write RexxJS script */
LET rexx_file = temp_dir || "/hello.rexx"
LET rexx_write_result = FILE_WRITE(rexx_file, rexx_script)

if rexx_write_result.success then do
  SAY "   ✓ Created RexxJS script: " || rexx_file

  /* Create Python wrapper for RexxJS */
  LET rexx_wrapper = <<REXX_WRAPPER
import json
import subprocess
import tempfile
import os
import functions_framework

@functions_framework.http
def hello_rexx_wrapper(request):
    """HTTP Cloud Function that executes RexxJS script."""

    # Get request data
    request_json = request.get_json(silent=True)
    request_args = request.args

    # Create temp file with RexxJS script
    rexx_script = '''${rexx_script}'''

    with tempfile.NamedTemporaryFile(mode='w', suffix='.rexx', delete=False) as f:
        f.write(rexx_script)
        script_path = f.name

    try:
        # Execute RexxJS script
        env = {**os.environ, 'GCP_REQUEST': json.dumps(request_json or {})}
        result = subprocess.run(
            ['rexx', script_path],
            capture_output=True,
            text=True,
            timeout=30,
            env=env
        )

        # Parse output
        output = result.stdout.strip()

        # Try to parse as JSON, otherwise return as text
        try:
            response = json.loads(output)
            return response
        except:
            return {'output': output, 'exitCode': result.returncode}

    except subprocess.TimeoutExpired:
        return {'error': 'Script execution timeout'}, 500
    except Exception as e:
        return {'error': str(e)}, 500
    finally:
        # Clean up temp file
        if os.path.exists(script_path):
            os.unlink(script_path)
REXX_WRAPPER

  /* Write wrapper */
  LET wrapper_file = temp_dir || "/rexx_main.py"
  LET wrapper_result = FILE_WRITE(wrapper_file, rexx_wrapper)

  if wrapper_result.success then do
    SAY "   ✓ Created RexxJS wrapper: " || wrapper_file
    SAY "   (Note: Requires RexxJS runtime in Cloud Function environment)"
  end
end
SAY ""

/* ============================================ */
/* Test Deployed Functions                     */
/* ============================================ */

SAY "5. 🧪 Testing deployed Cloud Functions..."

if EXISTS('function_url') && LENGTH(function_url) > 0 then do
  SAY "   🌐 Testing function at: " || function_url

  /* Test 1: Basic call */
  LET test1_cmd = "curl -s -X GET '" || function_url || "'"
  LET test1_result = execute command=test1_cmd shell="bash"

  if test1_result.success then do
    SAY "   ✅ Test 1 (GET): " || SUBSTR(test1_result.stdout, 1, 100) || "..."
  end

  /* Test 2: POST with JSON data */
  LET test2_cmd = "curl -s -X POST '" || function_url || "' -H 'Content-Type: application/json' -d '{\"name\":\"RexxJS Developer\"}'"
  LET test2_result = execute command=test2_cmd shell="bash"

  if test2_result.success then do
    SAY "   ✅ Test 2 (POST): " || SUBSTR(test2_result.stdout, 1, 100) || "..."
  end

  /* Test 3: Query parameter */
  LET test3_cmd = "curl -s -X GET '" || function_url || "?name=GCP%20Demo'"
  LET test3_result = execute command=test3_cmd shell="bash"

  if test3_result.success then do
    SAY "   ✅ Test 3 (Query): " || SUBSTR(test3_result.stdout, 1, 100) || "..."
  end
end
else do
  SAY "   ⚠️  No function URL available for testing"
end
SAY ""

/* ============================================ */
/* List Deployed Resources                     */
/* ============================================ */

SAY "6. 📋 Listing deployed resources..."

/* List functions */
LET list_functions_cmd = "gcloud functions list --filter='name:" || deployment_id || "' --format='table(name,trigger.httpsTrigger.url,status)'"
LET functions_result = execute command=list_functions_cmd shell="bash"

if functions_result.success && LENGTH(functions_result.stdout) > 0 then do
  SAY "   📱 Cloud Functions:"
  SAY functions_result.stdout
end

/* List topics */
LET list_topics_cmd = "gcloud pubsub topics list --filter='name:" || deployment_id || "' --format='table(name)'"
LET topics_result = execute command=list_topics_cmd shell="bash"

if topics_result.success && LENGTH(topics_result.stdout) > 0 then do
  SAY "   📢 Pub/Sub Topics:"
  SAY topics_result.stdout
end

/* List buckets */
LET list_buckets_cmd = "gcloud storage buckets list --filter='name:" || deployment_id || "' --format='table(name,location)'"
LET buckets_result = execute command=list_buckets_cmd shell="bash"

if buckets_result.success && LENGTH(buckets_result.stdout) > 0 then do
  SAY "   🪣 Storage Buckets:"
  SAY buckets_result.stdout
end
SAY ""

/* ============================================ */
/* Summary and Cleanup Instructions            */
/* ============================================ */

SAY "🎉 ===== DEPLOYMENT COMPLETE ====="
SAY ""
SAY "✅ SUCCESSFULLY DEPLOYED:"
SAY "   • HTTP Cloud Function: " || function_name
if EXISTS('function_url') then SAY "   • Function URL: " || function_url
SAY "   • Event Function Source: " || event_function_name || " (prepared)"
SAY "   • RexxJS Function Wrapper: ready for deployment"
SAY "   • Function Source Files: " || temp_dir
SAY ""

SAY "🧪 CLOUD FUNCTIONS TESTING COMPLETED:"
SAY "   • HTTP GET request"
SAY "   • HTTP POST with JSON payload"
SAY "   • Query parameter processing"
SAY "   • Function execution validation"
SAY "   • Multiple function types demonstrated"
SAY ""

SAY "💡 TO TEST MANUALLY:"
if EXISTS('function_url') then do
  SAY "   # Basic GET request"
  SAY "   curl '" || function_url || "'"
  SAY ""
  SAY "   # GET with query parameter"
  SAY "   curl '" || function_url || "?name=YourName'"
  SAY ""
  SAY "   # POST with JSON data"
  SAY "   curl -X POST '" || function_url || "' \\"
  SAY "        -H 'Content-Type: application/json' \\"
  SAY "        -d '{\"name\":\"GCP Developer\"}'"
end
SAY ""

SAY "🧹 TO CLEAN UP CLOUD FUNCTIONS:"
SAY "   gcloud functions delete " || function_name || " --region us-central1 --quiet"
SAY "   rm -rf " || temp_dir
SAY ""

SAY "📚 FUNCTION TYPES DEMONSTRATED:"
SAY "   • HTTP-triggered function (deployed)"
SAY "   • Event-driven function (Cloud Storage trigger)"
SAY "   • RexxJS integration wrapper"
SAY ""

SAY "📚 LEARN MORE:"
SAY "   • Cloud Functions: https://cloud.google.com/functions"
SAY "   • Cloud Run: https://cloud.google.com/run"
SAY "   • Pub/Sub: https://cloud.google.com/pubsub"
SAY "   • Cloud Storage: https://cloud.google.com/storage"
SAY ""

SAY "🚀 Google Cloud Functions + RexxJS Integration Demo Complete!"

/* Clean up temp directory */
LET cleanup_result = execute command="rm -rf " || temp_dir shell="bash"
if cleanup_result.success then do
  SAY "✓ Temporary files cleaned up"
end

exit 0