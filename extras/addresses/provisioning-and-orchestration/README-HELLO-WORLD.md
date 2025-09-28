# Hello World Examples for Local Serverless

This directory contains hello world examples and demos for both **ADDRESS LAMBDA** and **ADDRESS OPENFAAS** handlers.

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Run the setup script to install dependencies
./setup-local-serverless.rexx
```

### 2. Verify Environment
```bash
# Check that all services are working with curl tests
./verify-serverless.rexx
```

### 3. Test Lambda Hello World
```bash
# Run the Rexx test script (includes function verification)
./hello-lambda-test.rexx

# Or run the JavaScript demo
node demo-lambda-hello.js
```

### 4. Test OpenFaaS Hello World
```bash
# Run the Rexx test script (includes HTTP curl tests)
./hello-openfaas-test.rexx

# Or run the JavaScript demo
node demo-openfaas-hello.js
```

## 📋 Prerequisites

### For Lambda Testing
- **SAM CLI**: Local AWS Lambda development
  ```bash
  pip3 install aws-sam-cli
  ```
- **Docker**: For containerized functions
- **LocalStack** (optional): Local AWS simulation
  ```bash
  pip3 install localstack
  localstack start -d
  ```

### For OpenFaaS Testing
- **Docker**: Required for OpenFaaS
- **faas-cli**: OpenFaaS command line
  ```bash
  curl -sSL https://cli.openfaas.com | sudo sh
  ```
- **OpenFaaS Stack**: Deploy with Docker Swarm
  ```bash
  docker swarm init
  git clone https://github.com/openfaas/faas
  cd faas && ./deploy_stack.sh
  ```

## ✅ Success Verification

The test scripts now include **multiple verification methods**:

### HTTP Testing (OpenFaaS)
- **HTTP_POST() functions** test function endpoints directly
- Verifies HTTP responses from `http://localhost:8080/function/name`
- Tests both default and custom payloads
- Validates actual function execution

### Service Health Checks
- **Gateway connectivity** via `HTTP_GET('http://localhost:8080/system/info')`
- **Function listing** via `HTTP_GET('http://localhost:8080/system/functions')`
- **Return code validation** from ADDRESS commands
- **Service status** checks for Docker, OpenFaaS, SAM CLI

### Environment Verification (`verify-serverless.rexx`)
```bash
./verify-serverless.rexx
```
**Checks:**
- ✅ Docker installation and daemon status
- ✅ SAM CLI availability for Lambda testing
- ✅ faas-cli installation and version
- ✅ Docker Swarm initialization
- ✅ OpenFaaS services deployment
- ✅ Gateway HTTP response (port 8080)
- ✅ ADDRESS handler functionality
- ✅ Optional tools (LocalStack, kubectl)

**Example Output:**
```
=== Verification Summary ===
Essential services: 4/4 working
🎉 All essential services are working!

Ready to run:
  ./hello-lambda-test.rexx
  ./hello-openfaas-test.rexx
```

## 🧪 What the Tests Do

### Lambda Hello World (`hello-lambda-test.rexx`)
1. ✅ Check environment status
2. 📦 Create Python "Hello World" function
3. 🚀 Deploy and test with default payload
4. 🎯 Test with custom name parameter
5. 📄 Deploy RexxJS function
6. 🧪 Test RexxJS function execution
7. 📋 List all functions
8. 🧹 Clean up resources

**Example Output:**
```
=== Local Lambda Hello World Test ===

1. Checking Lambda environment...
✓ Lambda environment ready

2. Creating hello-world function...
✓ Function created successfully

3. Testing function with default payload...
✓ Default test passed

4. Testing function with custom name...
✓ Custom name test passed

5. Creating RexxJS hello function...
✓ RexxJS function deployed

6. Testing RexxJS function...
✓ RexxJS function test passed

7. Listing all functions...
hello-world, hello-rexx

8. Cleaning up...
✓ Cleanup completed
```

### OpenFaaS Hello World (`hello-openfaas-test.rexx`)
1. ✅ Check OpenFaaS environment status
2. 📋 List available function templates
3. 🐍 Create Python "Hello World" function
4. ⏱️ Wait for function deployment
5. 🌐 **Test via HTTP_POST()** (`http://localhost:8080/function/hello-world`)
6. 🎯 **Verify HTTP responses** with custom payloads
7. 📝 Test via ADDRESS commands (comparison)
8. 📈 Scale function to multiple replicas
9. 📊 Get function details and logs
10. 📄 Deploy RexxJS function
11. 🧪 Test RexxJS function execution
12. 🧹 Clean up resources

**Example RexxJS Function:**
```rexx
parse arg input
if input = "" then input = "World"
SAY "Hello from RexxJS OpenFaaS, " || input || "!"
```

## 🎯 Key Features Demonstrated

### Lambda Features
- ✅ Local development environment
- ✅ Python function packaging and deployment
- ✅ Function invocation with custom payloads
- ✅ RexxJS script integration
- ✅ Environment auto-detection
- ✅ Multi-environment support (local/AWS/LocalStack)

### OpenFaaS Features
- ✅ Docker Swarm integration
- ✅ Function templates and builds
- ✅ Auto-scaling and replica management
- ✅ Real-time logs and monitoring
- ✅ RexxJS script containerization
- ✅ HTTP-based function invocation

## 🔧 Troubleshooting

### Lambda Issues
```bash
# Check SAM CLI installation
sam --version

# Check Docker
docker info

# Start LocalStack (if needed)
localstack start -d
```

### OpenFaaS Issues
```bash
# Check Docker Swarm
docker node ls

# Check OpenFaaS services
docker service ls | grep openfaas

# Check faas-cli
faas-cli version

# Access OpenFaaS UI
open http://localhost:8080
```

### Environment Detection
Both handlers auto-detect their environment:
- **Lambda**: local → LocalStack → AWS
- **OpenFaaS**: Docker Swarm → Kubernetes → local

## ✅ **Now Using Native HTTP Functions!**

**The tests have been updated to use the new HTTP functions:**
```bash
# OpenFaaS test now uses HTTP_POST() and HTTP_GET()
./hello-openfaas-test.rexx

# Compare with the elegant concept demo
./hello-openfaas-elegant.rexx
```

**What's been implemented:**
- ✅ **HTTP_GET()** and **HTTP_POST()** functions are now available in RexxJS core
- ✅ **OpenFaaS tests** use `HTTP_POST()` instead of curl system calls
- ✅ **Gateway verification** uses `HTTP_GET()` for health checks
- ✅ **No more temporary files** - direct response handling

See [REXX_FEATURES_NEEDED.md](REXX_FEATURES_NEEDED.md) for additional features that would make RexxJS even better for serverless development.

## 📚 Related Documentation
- [README-LAMBDA.md](README-LAMBDA.md) - Complete Lambda documentation
- [README-OPENFAAS.md](README-OPENFAAS.md) - Complete OpenFaaS documentation
- [REXX_FEATURES_NEEDED.md](REXX_FEATURES_NEEDED.md) - Wishlist for HTTP/JSON functions
- Test files: `__tests__/address-*-*.test.js`

## 🎮 Interactive Testing

You can also test individual commands interactively:

```rexx
/* Test Lambda commands */
address lambda "status"
address lambda "list"
address lambda "deploy_rexx name=test rexx_script='SAY \"Hello!\"'"

/* Test OpenFaaS commands */
address openfaas "status"
address openfaas "list"
address openfaas "deploy_rexx name=test rexx_script='SAY \"Hello!\"'"

/* NEW: Test direct HTTP calls */
response = HTTP_GET('http://localhost:8080/system/info')
SAY "Gateway: " response

result = HTTP_POST('http://localhost:8080/function/my-func', 'test data')
SAY "Function response: " result
```

The hello world examples provide a complete foundation for building more complex serverless applications with both platforms - now with **native HTTP functions** making testing much more elegant!