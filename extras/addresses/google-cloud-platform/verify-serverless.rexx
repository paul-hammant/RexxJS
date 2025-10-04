#!/usr/bin/env rexx
/* Verify Local Serverless Environment */

SAY "=== Verifying Local Serverless Environment ==="
SAY ""

/* 1. Check basic requirements */
SAY "1. Checking basic requirements..."

/* Docker */
ADDRESS SYSTEM "docker --version >/dev/null 2>&1"
if RC = 0 then
  SAY "✓ Docker installed"
else do
  SAY "✗ Docker not found"
  exit 1
end

ADDRESS SYSTEM "docker info >/dev/null 2>&1"
if RC = 0 then
  SAY "✓ Docker daemon running"
else do
  SAY "✗ Docker daemon not running"
  exit 1
end
SAY ""

/* 2. Check Lambda environment */
SAY "2. Checking Lambda environment..."

/* SAM CLI */
ADDRESS SYSTEM "sam --version >/dev/null 2>&1"
if RC = 0 then do
  SAY "✓ SAM CLI available"
  ADDRESS SYSTEM "sam --version"
else
  SAY "✗ SAM CLI not found"
end

/* Test Lambda handler */
address_lambda = "lambda"
ADDRESS (address_lambda) "status"
if RC = 0 then
  SAY "✓ Lambda ADDRESS handler working"
else
  SAY "✗ Lambda ADDRESS handler failed"

SAY ""

/* 3. Check OpenFaaS environment */
SAY "3. Checking OpenFaaS environment..."

/* faas-cli */
ADDRESS SYSTEM "faas-cli version >/dev/null 2>&1"
if RC = 0 then do
  SAY "✓ faas-cli available"
  ADDRESS SYSTEM "faas-cli version | head -1"
else
  SAY "✗ faas-cli not found"
end

/* Docker Swarm */
ADDRESS SYSTEM "docker node ls >/dev/null 2>&1"
if RC = 0 then
  SAY "✓ Docker Swarm active"
else
  SAY "✗ Docker Swarm not initialized"

/* OpenFaaS services */
ADDRESS SYSTEM "docker service ls | grep -q openfaas"
if RC = 0 then
  SAY "✓ OpenFaaS services running"
else
  SAY "✗ OpenFaaS services not found"

/* Test OpenFaaS gateway with HTTP_GET */
SAY "Testing OpenFaaS gateway..."
gateway_info = HTTP_GET('http://localhost:8080/system/info')
if LEFT(gateway_info, 5) = "ERROR" then do
  SAY "✗ OpenFaaS gateway not responding: " gateway_info
else do
  SAY "✓ OpenFaaS gateway responding (port 8080)"
  /* Show part of gateway info */
  SAY "Gateway info: " LEFT(gateway_info, 80) "..."
end

/* Test function list endpoint */
functions_info = HTTP_GET('http://localhost:8080/system/functions')
if LEFT(functions_info, 5) = "ERROR" then do
  SAY "✗ OpenFaaS functions endpoint not responding: " functions_info
else do
  SAY "✓ OpenFaaS functions endpoint responding"
  SAY "Functions data length: " LENGTH(functions_info)
end

/* Test OpenFaaS handler */
address_openfaas = "openfaas"
ADDRESS (address_openfaas) "status"
if RC = 0 then
  SAY "✓ OpenFaaS ADDRESS handler working"
else
  SAY "✗ OpenFaaS ADDRESS handler failed"

SAY ""

/* 4. Check optional tools */
SAY "4. Checking optional tools..."

/* LocalStack */
ADDRESS SYSTEM "localstack --version >/dev/null 2>&1"
if RC = 0 then do
  SAY "✓ LocalStack available"
  /* Check if running */
  ADDRESS SYSTEM "curl -s --connect-timeout 3 http://localhost:4566/health >/dev/null 2>&1"
  if RC = 0 then
    SAY "✓ LocalStack running (port 4566)"
  else
    SAY "  (LocalStack not running)"
else
  SAY "○ LocalStack not installed (optional)"
end

/* kubectl */
ADDRESS SYSTEM "kubectl version --client >/dev/null 2>&1"
if RC = 0 then
  SAY "✓ kubectl available (for K8s)"
else
  SAY "○ kubectl not installed (optional for K8s)"
end

SAY ""

/* 5. Summary */
SAY "=== Verification Summary ==="
SAY ""

/* Count successful checks */
success_count = 0

/* Essential checks */
ADDRESS SYSTEM "docker info >/dev/null 2>&1"
if RC = 0 then success_count = success_count + 1

ADDRESS (address_lambda) "status"
if RC = 0 then success_count = success_count + 1

ADDRESS SYSTEM "curl -s --connect-timeout 5 http://localhost:8080/system/info >/dev/null 2>&1"
if RC = 0 then success_count = success_count + 1

ADDRESS (address_openfaas) "status"
if RC = 0 then success_count = success_count + 1

total_checks = 4
SAY "Essential services: " || success_count || "/" || total_checks || " working"

if success_count = total_checks then do
  SAY "🎉 All essential services are working!"
  SAY ""
  SAY "Ready to run:"
  SAY "  ./hello-lambda-test.rexx"
  SAY "  ./hello-openfaas-test.rexx"
else do
  SAY "⚠️  Some services need attention"
  SAY ""
  SAY "Run ./setup-local-serverless.rexx to fix issues"
end

SAY ""
exit 0