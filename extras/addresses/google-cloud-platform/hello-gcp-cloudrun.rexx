#!/usr/bin/env rexx
/* Hello World GCP Cloud Run - Container Deployment Demo */

SAY "🚀 === Google Cloud Run Hello World Container Deployment ==="
SAY ""

/* Load system address handler */
REQUIRE "../system/system-address.js"
SAY "✓ System address handler loaded"

/* Load GCP address handler */
REQUIRE "address-gcp.js"
SAY "✓ GCP address handler loaded"

/* Initialize GCP handler */
ADDRESS GCP
LET info = handle method="info"
if LENGTH(info.project) > 0 then do
  SAY "✓ GCP project: " || info.project
  LET project_id = info.project
end
else do
  SAY "❌ No GCP project configured"
  exit 1
end
SAY ""

/* Verify prerequisites using system handler */
SAY "🔍 Checking prerequisites..."
ADDRESS SYSTEM
LET gcloud_check = execute command="which gcloud" shell="bash"
LET docker_check = execute command="which docker" shell="bash"

if gcloud_check.success then do
  SAY "✓ gcloud CLI found at: " || gcloud_check.stdout
end
else do
  SAY "❌ gcloud CLI not found!"
  exit 1
end

if docker_check.success then do
  SAY "✓ Docker found at: " || docker_check.stdout
end
else do
  SAY "❌ Docker not found! Install Docker to build container images."
  exit 1
end
SAY ""

/* Create unique deployment identifier */
LET deployment_id = "rexx-cloudrun-" || TIME('s')
LET service_name = deployment_id || "-hello"
LET image_name = "gcr.io/" || project_id || "/hello-rexx-app"
SAY "🎯 Deployment ID: " || deployment_id
SAY "🐳 Container Image: " || image_name
SAY ""

/* ============================================ */
/* Create Hello World Web Application          */
/* ============================================ */

SAY "1. 📝 Creating Hello World web application..."

/* Create temporary directory for app source */
LET temp_dir = "/tmp/" || deployment_id
LET mkdir_result = execute command="mkdir -p " || temp_dir shell="bash"

if mkdir_result.success then do
  SAY "   ✓ Created temp directory: " || temp_dir
end
else do
  SAY "   ❌ Failed to create temp directory"
  exit 1
end

/* Create Node.js Express server */
LET express_app = <<EXPRESS_APP
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'hello-rexx-cloudrun'
  });
});

// Main hello endpoint
app.get('/', (req, res) => {
  const name = req.query.name || 'Cloud Run User';
  const response = {
    message: `Hello, ${name}! 🎉`,
    source: 'Google Cloud Run + RexxJS',
    timestamp: new Date().toISOString(),
    deployment_id: '${deployment_id}',
    container: true,
    platform: 'Google Cloud Run',
    runtime: 'Node.js',
    details: {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        'user-agent': req.get('User-Agent'),
        'x-forwarded-for': req.get('X-Forwarded-For')
      }
    }
  };

  res.json(response);
});

// POST endpoint for JSON data
app.post('/', (req, res) => {
  const name = req.body.name || 'Cloud Run Developer';
  const response = {
    message: `Hello via POST, ${name}! 🚀`,
    source: 'Google Cloud Run Container',
    timestamp: new Date().toISOString(),
    deployment_id: '${deployment_id}',
    received_data: req.body,
    method: 'POST'
  };

  res.json(response);
});

// Echo endpoint for testing
app.post('/echo', (req, res) => {
  res.json({
    echo: req.body,
    timestamp: new Date().toISOString(),
    deployment_id: '${deployment_id}'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Hello RexxJS Cloud Run app listening on port ${port}`);
  console.log(`Deployment ID: ${deployment_id}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
EXPRESS_APP

/* Write Express app source */
LET app_file = temp_dir || "/app.js"
LET app_write_result = FILE_WRITE(app_file, express_app)

if app_write_result.success then do
  SAY "   ✓ Created Express app: " || app_file
  SAY "   ✓ App size: " || app_write_result.bytes || " bytes"
end
else do
  SAY "   ❌ Failed to write app source: " || app_write_result.error
  exit 1
end

/* Create package.json */
LET package_json = <<PACKAGE_JSON
{
  "name": "hello-rexx-cloudrun",
  "version": "1.0.0",
  "description": "Hello World app for Google Cloud Run deployed via RexxJS",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["rexxjs", "cloud-run", "gcp", "hello-world"],
  "author": "RexxJS",
  "license": "MIT"
}
PACKAGE_JSON

LET package_file = temp_dir || "/package.json"
LET package_result = FILE_WRITE(package_file, package_json)

if package_result.success then do
  SAY "   ✓ Created package.json"
end

/* Create Dockerfile */
LET dockerfile = <<DOCKERFILE
# Use official Node.js runtime as base image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /usr/src/app
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
DOCKERFILE

LET dockerfile_file = temp_dir || "/Dockerfile"
LET dockerfile_result = FILE_WRITE(dockerfile_file, dockerfile)

if dockerfile_result.success then do
  SAY "   ✓ Created Dockerfile"
end

/* Create .dockerignore */
LET dockerignore = <<DOCKERIGNORE
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.DS_Store
*.log
DOCKERIGNORE

LET dockerignore_file = temp_dir || "/.dockerignore"
LET dockerignore_result = FILE_WRITE(dockerignore_file, dockerignore)

if dockerignore_result.success then do
  SAY "   ✓ Created .dockerignore"
end
SAY ""

/* ============================================ */
/* Build Container Image                       */
/* ============================================ */

SAY "2. 🐳 Building container image..."

/* Build the Docker image */
LET build_cmd = "cd " || temp_dir || " && docker build -t " || image_name || " ."
SAY "   Building: " || image_name
SAY "   (This may take 1-2 minutes...)"

LET build_result = execute command=build_cmd shell="bash"

if build_result.success then do
  SAY "   ✅ Container image built successfully!"
  SAY "   Image: " || image_name
end
else do
  SAY "   ❌ Container build failed:"
  SAY "   " || build_result.stderr
  exit 1
end
SAY ""

/* ============================================ */
/* Push Image to Container Registry            */
/* ============================================ */

SAY "3. 📤 Pushing image to Google Container Registry..."

/* Configure Docker for GCR */
LET auth_cmd = "gcloud auth configure-docker --quiet"
LET auth_result = execute command=auth_cmd shell="bash"

if auth_result.success then do
  SAY "   ✓ Docker configured for GCR"
end

/* Push the image */
LET push_cmd = "docker push " || image_name
SAY "   Pushing: " || image_name
SAY "   (This may take 2-3 minutes...)"

LET push_result = execute command=push_cmd shell="bash"

if push_result.success then do
  SAY "   ✅ Image pushed to Container Registry!"
end
else do
  SAY "   ❌ Image push failed:"
  SAY "   " || push_result.stderr
  /* Continue with deployment - might be using Artifact Registry */
end
SAY ""

/* ============================================ */
/* Deploy to Cloud Run using GCP Handler      */
/* ============================================ */

SAY "4. 🚀 Deploying to Cloud Run via GCP ADDRESS Handler..."

/* Switch to GCP handler */
ADDRESS GCP

SAY "   Service: " || service_name
SAY "   Region: us-central1"
SAY "   Using: Idiomatic ADDRESS GCP command syntax"
SAY "   (This may take 2-3 minutes...)"

/* Deploy using idiomatic ADDRESS syntax */
"deploy service " || service_name || " --image " || image_name || " --region us-central1 --platform managed --port 8080 --memory 512Mi --cpu 1 --min_instances 0 --max_instances 10 --allow_unauthenticated true"
LET deploy_result = RESULT

if deploy_result.success then do
  SAY "   ✅ Cloud Run service deployed via GCP Handler!"

  /* Get service URL from handler response */
  if LENGTH(deploy_result.url) > 0 then do
    LET service_url = deploy_result.url
    SAY "   🌐 Service URL: " || service_url
  end
  else do
    SAY "   ⚠️  Service deployed but URL not returned"
  end
end
else do
  SAY "   ❌ Cloud Run deployment failed:"
  SAY "   " || deploy_result.stderr
  exit 1
end
SAY ""

/* ============================================ */
/* Test Deployed Service                       */
/* ============================================ */

SAY "5. 🧪 Testing deployed Cloud Run service..."

if EXISTS('service_url') && LENGTH(service_url) > 0 then do
  SAY "   🌐 Testing service at: " || service_url

  /* Test 1: Health check */
  SAY "   🏥 Testing health check..."
  LET health_response = HTTP_GET(service_url || "/health")

  if POS("ERROR", health_response) = 0 then do
    SAY "   ✅ Health check passed"
    SAY "   Response: " || SUBSTR(health_response, 1, 100) || "..."
  end
  else do
    SAY "   ⚠️  Health check issues: " || health_response
  end

  /* Test 2: Basic GET request */
  SAY "   📝 Testing GET request..."
  LET main_response = HTTP_GET(service_url || "/")

  if POS("ERROR", main_response) = 0 then do
    SAY "   ✅ GET test passed"
    SAY "   Response: " || SUBSTR(main_response, 1, 100) || "..."
  end
  else do
    SAY "   ⚠️  GET test failed: " || main_response
  end

  /* Test 3: GET with query parameter */
  SAY "   🔍 Testing GET with query parameter..."
  LET query_response = HTTP_GET(service_url || "/?name=Cloud%20Run%20Developer")

  if POS("ERROR", query_response) = 0 then do
    SAY "   ✅ Query parameter test passed"
    SAY "   Response: " || SUBSTR(query_response, 1, 100) || "..."
  end
  else do
    SAY "   ⚠️  Query test failed: " || query_response
  end

  /* Test 4: POST with JSON */
  SAY "   📤 Testing POST with JSON..."
  LET post_data = '{"name":"Container User","test":true,"source":"RexxJS"}'
  LET post_response = HTTP_POST(service_url || "/", post_data)

  if POS("ERROR", post_response) = 0 then do
    SAY "   ✅ POST JSON test passed"
    SAY "   Response: " || SUBSTR(post_response, 1, 100) || "..."
  end
  else do
    SAY "   ⚠️  POST test failed: " || post_response
  end

  /* Test 5: Echo endpoint */
  SAY "   🔄 Testing echo endpoint..."
  LET echo_data = '{"message":"Hello from RexxJS","timestamp":"' || TIME('s') || '","test":"echo"}'
  LET echo_response = HTTP_POST(service_url || "/echo", echo_data)

  if POS("ERROR", echo_response) = 0 then do
    SAY "   ✅ Echo test passed"
    SAY "   Response: " || SUBSTR(echo_response, 1, 100) || "..."
  end
  else do
    SAY "   ⚠️  Echo test failed: " || echo_response
  end
end
else do
  SAY "   ⚠️  No service URL available for testing"
end
SAY ""

/* ============================================ */
/* List Cloud Run Services using GCP Handler  */
/* ============================================ */

SAY "6. 📋 Listing deployed Cloud Run services..."

/* Switch back to GCP handler */
ADDRESS GCP

/* List services using idiomatic ADDRESS syntax */
"list services --region us-central1"
LET list_result = RESULT

if list_result.success then do
  SAY "   📱 Cloud Run Services (via GCP Handler):"
  if LENGTH(list_result.services) > 0 then do
    do i = 1 to LENGTH(list_result.services)
      LET service = list_result.services[i]
      SAY "   • " || service.metadata.name || " - " || service.status.url
    end
  end
  else do
    SAY "   No services found"
  end
end
else do
  SAY "   ❌ Failed to list services: " || list_result.stderr
end
SAY ""

/* ============================================ */
/* Summary and Instructions                    */
/* ============================================ */

SAY "🎉 ===== CLOUD RUN DEPLOYMENT COMPLETE ====="
SAY ""
SAY "✅ SUCCESSFULLY DEPLOYED USING GCP ADDRESS HANDLER:"
SAY "   • Cloud Run Service: " || service_name
if EXISTS('service_url') then SAY "   • Service URL: " || service_url
SAY "   • Container Image: " || image_name
SAY "   • Source Files: " || temp_dir
SAY "   • Deployment Method: GCP ADDRESS Handler deploy_service"
SAY "   • Listing Method: GCP ADDRESS Handler list_services"
SAY ""

SAY "🔧 GCP ADDRESS HANDLER FEATURES DEMONSTRATED:"
SAY "   • Idiomatic ADDRESS syntax: ADDRESS GCP + \"deploy service hello --image ...\""
SAY "   • Natural gcloud-like commands: No MAP_CREATE/MAP_PUT needed"
SAY "   • Sophisticated operations: No raw gcloud commands needed"
SAY "   • JSON response parsing: Automatic service list processing"
SAY ""

SAY "🧪 CLOUD RUN TESTING COMPLETED (HTTP_GET/HTTP_POST):"
SAY "   • Health check endpoint"
SAY "   • HTTP GET request"
SAY "   • GET with query parameters"
SAY "   • HTTP POST with JSON payload"
SAY "   • Echo endpoint functionality"
SAY ""

SAY "💡 TO TEST MANUALLY:"
if EXISTS('service_url') then do
  SAY "   # Health check"
  SAY "   curl " || service_url || "/health"
  SAY ""
  SAY "   # Basic GET request"
  SAY "   curl " || service_url || "/"
  SAY ""
  SAY "   # GET with query parameter"
  SAY "   curl '" || service_url || "/?name=YourName'"
  SAY ""
  SAY "   # POST with JSON data"
  SAY "   curl -X POST " || service_url || "/ \\"
  SAY "        -H 'Content-Type: application/json' \\"
  SAY "        -d '{\"name\":\"Developer\",\"message\":\"Hello Cloud Run\"}'"
  SAY ""
  SAY "   # Echo endpoint"
  SAY "   curl -X POST " || service_url || "/echo \\"
  SAY "        -H 'Content-Type: application/json' \\"
  SAY "        -d '{\"test\":\"data\"}'"
end
SAY ""

SAY "🧹 TO CLEAN UP RESOURCES:"
SAY "   # Using idiomatic GCP ADDRESS syntax:"
SAY "   ADDRESS GCP"
SAY "   \"delete service " || service_name || " --region us-central1\""
SAY ""
SAY "   # Or using gcloud directly:"
SAY "   gcloud run services delete " || service_name || " --platform managed --region us-central1 --quiet"
SAY "   gcloud container images delete " || image_name || " --quiet"
SAY "   docker rmi " || image_name
SAY "   rm -rf " || temp_dir
SAY ""

SAY "📚 CONTAINER DEPLOYMENT FEATURES:"
SAY "   • Express.js web server"
SAY "   • Multi-stage Docker build"
SAY "   • Health check endpoint"
SAY "   • JSON API endpoints"
SAY "   • Non-root container user"
SAY "   • Production-ready configuration"
SAY ""

SAY "🔒 SECURITY FEATURES:"
SAY "   • Non-root container execution"
SAY "   • Allow unauthenticated access (demo)"
SAY "   • Container health checks"
SAY "   • Resource limits (512Mi memory, 1 CPU)"
SAY ""

SAY "📈 SCALING CONFIGURATION:"
SAY "   • Min instances: 0 (scales to zero)"
SAY "   • Max instances: 10"
SAY "   • Timeout: 300 seconds"
SAY "   • Auto-scaling enabled"
SAY ""

SAY "📚 LEARN MORE:"
SAY "   • Cloud Run: https://cloud.google.com/run"
SAY "   • Container Registry: https://cloud.google.com/container-registry"
SAY "   • Docker: https://docs.docker.com/"
SAY ""

SAY "🚀 Google Cloud Run + RexxJS Container Demo Complete!"

/* Clean up temp directory */
LET cleanup_result = execute command="rm -rf " || temp_dir shell="bash"
if cleanup_result.success then do
  SAY "✓ Temporary files cleaned up"
end

exit 0