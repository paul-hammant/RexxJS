#!/usr/bin/env rexx
/* Setup Local Serverless Environment */

SAY "=== Setting up Local Serverless Environment ==="
SAY ""

/* 1. Check Docker */
SAY "1. Checking Docker installation..."
ADDRESS SYSTEM "docker --version 2>/dev/null"
if RC \= 0 then do
  SAY "✗ Docker not found. Please install Docker first:"
  SAY "  sudo apt update && sudo apt install docker.io"
  SAY "  sudo systemctl start docker"
  SAY "  sudo usermod -aG docker $USER"
  exit 1
end
SAY "✓ Docker is available"

ADDRESS SYSTEM "docker info >/dev/null 2>&1"
if RC \= 0 then do
  SAY "✗ Docker daemon not running. Starting Docker..."
  ADDRESS SYSTEM "sudo systemctl start docker"
  if RC \= 0 then do
    SAY "Failed to start Docker. Please start manually:"
    SAY "  sudo systemctl start docker"
    exit 1
  end
end
SAY "✓ Docker daemon is running"
SAY ""

/* 2. Setup Lambda environment */
SAY "2. Setting up Lambda environment..."

/* Check SAM CLI */
ADDRESS SYSTEM "sam --version 2>/dev/null"
if RC \= 0 then do
  SAY "Installing SAM CLI..."
  ADDRESS SYSTEM "pip3 install --user aws-sam-cli"
  if RC \= 0 then
    SAY "✓ SAM CLI installed"
  else do
    SAY "✗ Failed to install SAM CLI"
    SAY "Please install manually: pip3 install aws-sam-cli"
  end
else
  SAY "✓ SAM CLI already available"

/* Check LocalStack (optional) */
ADDRESS SYSTEM "localstack --version 2>/dev/null"
if RC \= 0 then do
  SAY "LocalStack not found (optional). To install:"
  SAY "  pip3 install localstack"
  SAY "  localstack start -d"
else
  SAY "✓ LocalStack available"
SAY ""

/* 3. Setup OpenFaaS environment */
SAY "3. Setting up OpenFaaS environment..."

/* Check faas-cli */
ADDRESS SYSTEM "faas-cli version 2>/dev/null"
if RC \= 0 then do
  SAY "Installing faas-cli..."
  ADDRESS SYSTEM "curl -sSL https://cli.openfaas.com | sudo sh"
  if RC = 0 then
    SAY "✓ faas-cli installed"
  else do
    SAY "✗ Failed to install faas-cli"
    SAY "Please install manually:"
    SAY "  curl -sSL https://cli.openfaas.com | sudo sh"
  end
else
  SAY "✓ faas-cli already available"

/* Deploy OpenFaaS stack */
SAY "Deploying OpenFaaS stack..."
ADDRESS SYSTEM "docker service ls | grep -q openfaas"
if RC \= 0 then do
  SAY "Deploying OpenFaaS with Docker Swarm..."
  ADDRESS SYSTEM "docker swarm init --advertise-addr 127.0.0.1 2>/dev/null || true"
  ADDRESS SYSTEM "git clone https://github.com/openfaas/faas /tmp/faas 2>/dev/null || true"
  ADDRESS SYSTEM "cd /tmp/faas && ./deploy_stack.sh"
  if RC = 0 then do
    SAY "✓ OpenFaaS deployed"
    SAY "Waiting for services to start..."
    call SysSleep 10
  else do
    SAY "✗ Failed to deploy OpenFaaS"
    SAY "Please deploy manually:"
    SAY "  git clone https://github.com/openfaas/faas"
    SAY "  cd faas && ./deploy_stack.sh"
  end
else
  SAY "✓ OpenFaaS already running"
SAY ""

/* 4. Create test workspace */
SAY "4. Creating test workspace..."
ADDRESS SYSTEM "mkdir -p /tmp/serverless-test"
ADDRESS SYSTEM "cd /tmp/serverless-test"
SAY "✓ Test workspace created at /tmp/serverless-test"
SAY ""

/* 5. Test both environments */
SAY "5. Testing environments..."

SAY "Testing Lambda environment:"
address_lambda = "lambda"
ADDRESS (address_lambda) "status"
if RC = 0 then
  SAY "✓ Lambda environment ready"
else
  SAY "✗ Lambda environment not ready"

SAY "Testing OpenFaaS environment:"
address_openfaas = "openfaas"
ADDRESS (address_openfaas) "status"
if RC = 0 then
  SAY "✓ OpenFaaS environment ready"
else
  SAY "✗ OpenFaaS environment not ready"

/* Also test OpenFaaS gateway with HTTP_GET */
SAY "Testing OpenFaaS gateway connectivity..."
gateway_info = HTTP_GET('http://localhost:8080/system/info')
if LEFT(gateway_info, 5) = "ERROR" then do
  SAY "✗ OpenFaaS gateway not responding: " gateway_info
else do
  SAY "✓ OpenFaaS gateway responding"
  SAY "Gateway info: " LEFT(gateway_info, 100) "..."
end
SAY ""

/* 6. Show next steps */
SAY "=== Setup Complete ==="
SAY ""
SAY "Next steps:"
SAY "1. Run Lambda hello world test:"
SAY "   ./hello-lambda-test.rexx"
SAY ""
SAY "2. Run OpenFaaS hello world test:"
SAY "   ./hello-openfaas-test.rexx"
SAY ""
SAY "3. Access OpenFaaS UI at: http://localhost:8080"
SAY "4. Get OpenFaaS password with: echo $(docker secret ls)"
SAY ""

exit 0