# ADDRESS OPENFAAS - Serverless Function Management

RexxJS integration for OpenFaaS (Functions as a Service) serverless platform operations.

## Key Features

✅ **Function lifecycle management** - Create, deploy, invoke, scale, and remove serverless functions
✅ **Multi-backend support** - Docker Swarm and Kubernetes with auto-detection
✅ **RexxJS function deployment** - Deploy and execute RexxJS scripts as serverless functions
✅ **OpenFaaS store integration** - Deploy pre-built functions from the OpenFaaS store
✅ **Complete CLI operations** - All faas-cli commands available through RexxJS
✅ **Secret and namespace management** - Full OpenFaaS platform administration
✅ **Security policies** - Image validation, trusted registries, function limits
✅ **Production-ready** - Process monitoring, audit logging, health checks

## Quick Comparison: OpenFaaS vs Traditional Containers

| Feature | OpenFaaS | Docker/Podman |
|---------|----------|---------------|
| **Function Type** | Serverless functions | Long-running containers |
| **Scaling** | ✅ Auto-scaling (0-N) | ⚠️ Manual scaling |
| **Invocation** | ✅ HTTP triggers | ⚠️ Manual execution |
| **Cold starts** | ⚠️ Yes (fast) | ✅ No cold starts |
| **Resource efficiency** | 🚀 Scale to zero | 🐢 Always consuming |
| **Event-driven** | ✅ Built-in | ⚠️ Manual setup |
| **Function store** | ✅ Pre-built functions | ❌ Manual building |
| **Best for** | Event processing, APIs | Microservices, databases |

## Backend Comparison: Docker Swarm vs Kubernetes

| Feature | Docker Swarm | Kubernetes |
|---------|--------------|------------|
| **Setup complexity** | 🚀 Simple | 🐢 Complex |
| **Resource usage** | 🚀 Light | 🐢 Heavy |
| **Scaling features** | ✅ Basic | 🚀 Advanced |
| **Production readiness** | ✅ Good | 🚀 Enterprise |
| **Learning curve** | 🚀 Easy | 🐢 Steep |
| **Best for** | Development, small teams | Production, large scale |

## Basic Usage

```rexx
REQUIRE "rexxjs/address-openfaas" AS OPENFAAS
ADDRESS OPENFAAS

/* Initialize with Docker Swarm (recommended for development) */
"initialize backend=swarm gateway_url=http://localhost:8080"

/* Or initialize with Kubernetes */
"initialize backend=kubernetes gateway_url=http://localhost:8080"

/* Check status */
"status"

/* List functions */
"list"

/* Deploy a function */
"deploy name=hello-python image=functions/hello-python:latest"

/* Invoke function */
"invoke name=hello-python data=\"World\""

/* Remove function */
"remove name=hello-python"
```

## OpenFaaS Installation

OpenFaaS requires either Docker Swarm or Kubernetes as a backend. Here's how to set up both:

### Docker Swarm Setup (Recommended for Development)

```bash
# 1. Initialize Docker Swarm
sudo docker swarm init

# 2. Install faas-cli
curl -sL https://cli.openfaas.com | sudo sh

# 3. Deploy OpenFaaS stack
git clone https://github.com/openfaas/faas
cd faas
sudo ./deploy_stack.sh

# 4. Verify installation
curl -s http://localhost:8080/system/functions
```

### Kubernetes Setup (Production)

```bash
# 1. Install faas-cli
curl -sL https://cli.openfaas.com | sudo sh

# 2. Install OpenFaaS with arkade (easiest)
curl -sLS https://get.arkade.dev | sudo sh
sudo arkade install openfaas

# 3. Or install with Helm
helm repo add openfaas https://openfaas.github.io/faas-netes/
helm upgrade openfaas --install openfaas/openfaas --namespace openfaas --set functionNamespace=openfaas-fn --create-namespace

# 4. Port forward to access gateway
kubectl port-forward -n openfaas svc/gateway 8080:8080 &
```

### Verification

```rexx
ADDRESS OPENFAAS

/* Auto-detect backend and verify setup */
"initialize backend=auto"
"verify_backend"
```

## Function Lifecycle Management

### Complete Function Development Workflow

```rexx
ADDRESS OPENFAAS

/* 1. Create new function from template */
"new name=my-function lang=python3"

/* 2. Build function image */
"build name=my-function"

/* 3. Push to registry (optional for local development) */
"push name=my-function"

/* 4. Deploy function */
"deploy name=my-function image=my-function:latest"

/* 5. Test function */
"invoke name=my-function data=\"test input\""

/* 6. Scale function */
"scale name=my-function replicas=3"

/* 7. Check logs */
"logs name=my-function lines=50"

/* 8. Update and redeploy */
"deploy name=my-function image=my-function:v2"

/* 9. Remove when done */
"remove name=my-function"
```

### Pre-built Functions from Store

```rexx
ADDRESS OPENFAAS

/* Browse available functions */
"store_list"

/* Deploy function from store */
"store_deploy name=figlet"

/* Use the function */
"invoke name=figlet data=\"Hello OpenFaaS!\""
```

## RexxJS Function Deployment

Deploy and execute RexxJS scripts as serverless functions:

```rexx
ADDRESS OPENFAAS

/* Deploy RexxJS function with inline script */
"deploy_rexx name=rexx-hello rexx_script=\"SAY 'Hello from RexxJS function!'; SAY ARG(1)\""

/* Invoke RexxJS function */
"invoke_rexx name=rexx-hello data=\"World\""

/* Deploy RexxJS function from file */
"deploy_rexx name=rexx-processor rexx_script_file=/host/scripts/processor.rexx"

/* Invoke with JSON data */
"invoke_rexx name=rexx-processor data='{\"input\": \"process this\"}'"
```

**How it works:**
1. Creates a Docker image with RexxJS binary
2. Wraps your RexxJS script as HTTP handler
3. Deploys as standard OpenFaaS function
4. Scales automatically based on demand

## Function Invocation Methods

### Synchronous Invocation (Default)

```rexx
ADDRESS OPENFAAS

/* Standard synchronous call - waits for response */
"invoke name=my-function data=\"input data\""
response = OPENFAAS_OUTPUT

SAY "Function returned:" response
```

### Asynchronous Invocation

```rexx
ADDRESS OPENFAAS

/* Fire-and-forget asynchronous call */
"invoke name=background-processor data=\"large dataset\" async=true"

/* Returns immediately, function runs in background */
SAY "Function invoked asynchronously"
```

### Function with Environment Data

```rexx
ADDRESS OPENFAAS

/* Deploy function with environment variables */
"deploy name=api-client image=my-api:latest env=API_KEY=secret123,DEBUG=true"

/* Invoke function (uses environment variables) */
"invoke name=api-client data='{\"endpoint\": \"/users\"}'"
```

## Advanced Function Management

### Auto-scaling Configuration

```rexx
ADDRESS OPENFAAS

/* Deploy with auto-scaling (Kubernetes backend) */
"deploy name=web-api image=my-web-api:latest"

/* Configure auto-scaling */
"scale name=web-api min=1 max=10"

/* Function will scale between 1-10 replicas based on load */
```

### Function with Custom Configuration

```rexx
ADDRESS OPENFAAS

/* Deploy with labels and constraints */
"deploy name=gpu-function image=ml-model:latest labels=tier=ml,gpu=required constraints=node.role==worker"

/* Deploy with resource limits */
"deploy name=memory-intensive image=data-processor:latest memory=2048m cpu=1000m"
```

## Secret and Namespace Management

```rexx
ADDRESS OPENFAAS

/* Create secret */
"secret_create name=api-token from_literal=mytoken123"

/* List secrets */
"secret_list"

/* Create namespace for multi-tenancy */
"namespace_create name=development"

/* Deploy function to specific namespace */
"deploy name=dev-function image=test:latest namespace=development"

/* List namespaces */
"namespace_list"
```

## Monitoring and Observability

```rexx
ADDRESS OPENFAAS

/* Start process monitoring */
"start_monitoring"

/* Get process statistics */
"process_stats"

/* Check function logs */
"logs name=my-function lines=100 follow=true"

/* Get function metrics */
"describe name=my-function"

/* Stop monitoring */
"stop_monitoring"
```

## Platform Administration

### Health and Status Monitoring

```rexx
ADDRESS OPENFAAS

/* Check OpenFaaS system status */
"status"

/* Verify backend installation */
"verify_backend"

/* Get checkpoint monitoring status */
"checkpoint_status"
```

### Bulk Operations

```rexx
ADDRESS OPENFAAS

/* Cleanup all functions */
"cleanup all=true"

/* Or cleanup specific functions */
"cleanup pattern=test-*"

/* List all functions across namespaces */
"list namespace=all"
```

## Security Configuration

### Strict Security Mode

```rexx
ADDRESS OPENFAAS

/* Initialize with strict security */
handler = createOpenFaaSHandler({
  securityMode: 'strict',
  allowedImages: ['docker.io/functions/*', 'ghcr.io/myorg/*'],
  trustedRegistries: ['docker.io', 'ghcr.io'],
  maxFunctions: 50
})

/* Only whitelisted images can be deployed */
"deploy name=safe-func image=docker.io/functions/hello-python:latest"  /* ✅ Allowed */
"deploy name=unsafe-func image=malicious.com/hack:latest"  /* ❌ Blocked */
```

### Permissive Mode (Development)

```rexx
ADDRESS OPENFAAS

/* Initialize with permissive security */
handler = createOpenFaaSHandler({
  securityMode: 'permissive'
})

/* Any image can be deployed */
"deploy name=any-func image=any-registry.com/any-image:latest"  /* ✅ Allowed */
```

### Security Auditing

```rexx
ADDRESS OPENFAAS

/* Get security audit log */
"security_audit"

/* Check security policies */
policies = OPENFAAS_POLICIES
SAY "Security mode:" policies.securityMode
SAY "Max functions:" policies.maxFunctions
```

## Backend Detection and Management

```rexx
ADDRESS OPENFAAS

/* Auto-detect backend */
"initialize backend=auto"
detectedBackend = OPENFAAS_DETECTED_BACKEND
SAY "Detected backend:" detectedBackend

/* Manual backend selection */
"initialize backend=kubernetes gateway_url=http://localhost:8080"
"initialize backend=swarm gateway_url=http://localhost:8080"

/* Switch between backends */
"detect_backend"
IF OPENFAAS_DETECTED_BACKEND = "kubernetes" THEN
  SAY "Using Kubernetes features"
ELSE
  SAY "Using Docker Swarm features"
```

## Error Handling and Troubleshooting

### Common Error Scenarios

```rexx
ADDRESS OPENFAAS

/* Handle deployment failures */
result = handleAddressCommand('deploy name=test image=nonexistent:latest')
IF \result.success THEN DO
  SAY "Deployment failed:" result.error
  /* Check if image exists, registry accessible, etc. */
END

/* Handle function not found */
result = handleAddressCommand('invoke name=nonexistent')
IF \result.success THEN DO
  SAY "Function not found:" result.error
  /* List available functions */
  "list"
END

/* Handle scaling failures */
result = handleAddressCommand('scale name=test replicas=100')
IF \result.success THEN DO
  SAY "Scaling failed (resource limits?):" result.error
END
```

### Debug Information

```rexx
ADDRESS OPENFAAS

/* Get detailed status */
"status"
SAY "Gateway URL:" OPENFAAS_GATEWAY_URL
SAY "Backend:" OPENFAAS_BACKEND
SAY "Active functions:" OPENFAAS_ACTIVE_FUNCTIONS

/* Check system resources */
"process_stats"
```

## Available Commands

### Function Lifecycle
| Command | Description | Parameters |
|---------|-------------|------------|
| `status` | Get handler and gateway status | none |
| `list` | List deployed functions | `namespace` |
| `new` | Create new function from template | `name`, `lang`, `prefix` |
| `build` | Build function image | `name`, `image`, `no_cache`, `build_arg` |
| `push` | Push function image to registry | `name`, `image` |
| `deploy` | Deploy function | `name`, `image`, `env`, `labels`, `constraints`, `memory`, `cpu` |
| `invoke` | Invoke function | `name`, `data`, `async`, `http_method` |
| `remove` | Remove function | `name` |
| `scale` | Scale function | `name`, `replicas` or `min`/`max` |
| `logs` | Get function logs | `name`, `lines`, `follow` |
| `describe` | Get function details | `name` |

### RexxJS Integration
| Command | Description | Parameters |
|---------|-------------|------------|
| `deploy_rexx` | Deploy RexxJS function | `name`, `rexx_script` or `rexx_script_file`, `image_base` |
| `invoke_rexx` | Invoke RexxJS function (alias for invoke) | `name`, `data` |

### OpenFaaS Store
| Command | Description | Parameters |
|---------|-------------|------------|
| `store_list` | List store functions | `platform`, `author` |
| `store_deploy` | Deploy from store | `name`, `network` |

### Platform Management
| Command | Description | Parameters |
|---------|-------------|------------|
| `secret_create` | Create secret | `name`, `from_literal` or `from_file` |
| `secret_list` | List secrets | none |
| `namespace_create` | Create namespace | `name` |
| `namespace_list` | List namespaces | none |
| `cleanup` | Remove functions | `all`, `pattern` |

### Monitoring & Administration
| Command | Description | Parameters |
|---------|-------------|------------|
| `verify_backend` | Verify OpenFaaS installation | none |
| `detect_backend` | Detect Docker Swarm vs Kubernetes | none |
| `security_audit` | Get security audit log | none |
| `process_stats` | Get process statistics | none |
| `start_monitoring` | Start process monitoring | none |
| `stop_monitoring` | Stop process monitoring | none |
| `checkpoint_status` | Get checkpoint status | none |

## REXX Variables

After each operation, these variables are set:

- `OPENFAAS_OPERATION` - The operation performed
- `OPENFAAS_FUNCTION` - Function name
- `OPENFAAS_STATUS` - Operation status
- `OPENFAAS_OUTPUT` - Function output or command result
- `OPENFAAS_ERROR` - Error message (if failed)
- `OPENFAAS_GATEWAY_URL` - OpenFaaS gateway URL
- `OPENFAAS_BACKEND` - Backend type (swarm/kubernetes)
- `OPENFAAS_DETECTED_BACKEND` - Auto-detected backend
- `OPENFAAS_EXIT_CODE` - Command exit code

## Requirements

### Host System Requirements

**Essential packages:**
- `docker` - Container runtime
- `faas-cli` - OpenFaaS command-line tool
- Either Docker Swarm or Kubernetes cluster

**Installation commands:**

**Install faas-cli:**
```bash
curl -sL https://cli.openfaas.com | sudo sh
```

**Verify Docker:**
```bash
docker --version
docker info
```

**For Docker Swarm (Recommended for development):**
```bash
# Initialize swarm if not already done
sudo docker swarm init

# Deploy OpenFaaS
git clone https://github.com/openfaas/faas
cd faas
sudo ./deploy_stack.sh
```

**For Kubernetes (Production):**
```bash
# Install with arkade (easiest)
curl -sLS https://get.arkade.dev | sudo sh
sudo arkade install openfaas

# Or use Helm
helm repo add openfaas https://openfaas.github.io/faas-netes/
helm upgrade openfaas --install openfaas/openfaas \
  --namespace openfaas \
  --set functionNamespace=openfaas-fn \
  --create-namespace
```

### Permissions

User must have access to:
- Docker daemon (member of `docker` group)
- faas-cli command
- OpenFaaS gateway (network access)

```bash
sudo usermod -a -G docker $USER
# Logout and login again for changes to take effect
```

### OpenFaaS Gateway

The OpenFaaS gateway must be accessible:
- Default URL: `http://localhost:8080`
- For remote gateways, ensure firewall allows access
- For Kubernetes, may need port forwarding: `kubectl port-forward -n openfaas svc/gateway 8080:8080`

### Function Registry

For pushing custom functions:
- Docker Hub account (or private registry)
- Appropriate credentials configured
- Registry must be accessible from OpenFaaS cluster

### Verification

Run verification to check all requirements:
```rexx
ADDRESS OPENFAAS
"verify_backend"
```

This checks:
- faas-cli installation
- Docker availability
- OpenFaaS gateway connectivity
- Backend type detection
- Basic function operations

## Security

The handler enforces configurable security policies:

- **Image validation** - Whitelist allowed registries and images
- **Function limits** - Maximum number of deployed functions
- **Command filtering** - Block dangerous operations
- **Audit logging** - Track all operations and security events
- **Registry validation** - Only allow trusted registries

### Security Modes

**Strict Mode (Production):**
```javascript
{
  securityMode: 'strict',
  allowedImages: new Set(['docker.io/functions/*']),
  trustedRegistries: new Set(['docker.io', 'ghcr.io']),
  maxFunctions: 50
}
```

**Permissive Mode (Development):**
```javascript
{
  securityMode: 'permissive'
  // All images and registries allowed
}
```

## Troubleshooting

### Gateway Connection Issues

**Problem:** Cannot connect to OpenFaaS gateway

**Solutions:**
```bash
# 1. Check if OpenFaaS is running
docker service ls  # For Swarm
kubectl get pods -n openfaas  # For Kubernetes

# 2. Verify gateway is accessible
curl http://localhost:8080/system/functions

# 3. Check port forwarding (Kubernetes)
kubectl port-forward -n openfaas svc/gateway 8080:8080 &

# 4. Check firewall
sudo ufw status
```

**From RexxJS:**
```rexx
ADDRESS OPENFAAS
"verify_backend"
```

### Function Deployment Fails

**Problem:** Function deployment fails with image errors

**Solutions:**
```bash
# 1. Check image exists
docker pull functions/hello-python:latest

# 2. Verify registry access
docker login

# 3. Check OpenFaaS can pull images
faas-cli deploy --image=functions/hello-python:latest --name=test
```

**From RexxJS:**
```rexx
ADDRESS OPENFAAS

/* Try with known good image */
"deploy name=test-func image=functions/hello-python:latest"

/* Check security policies */
"security_audit"
```

### Function Invocation Timeouts

**Problem:** Function invocations timeout or fail

**Solutions:**
```bash
# 1. Check function is running
faas-cli list

# 2. Check function logs
faas-cli logs test-func

# 3. Test function directly
curl -X POST http://localhost:8080/function/test-func -d "test"
```

**From RexxJS:**
```rexx
ADDRESS OPENFAAS

/* Check function status */
"list"
"describe name=my-function"

/* Check logs for errors */
"logs name=my-function lines=50"

/* Try simple test */
"invoke name=my-function data=\"test\""
```

### Backend Detection Issues

**Problem:** Cannot detect Docker Swarm or Kubernetes

**Solutions:**
```bash
# 1. Check Docker Swarm status
docker node ls

# 2. Check Kubernetes status
kubectl cluster-info

# 3. Verify faas-cli can detect backend
faas-cli list
```

**From RexxJS:**
```rexx
ADDRESS OPENFAAS

/* Force backend detection */
"detect_backend"
SAY "Detected:" OPENFAAS_DETECTED_BACKEND

/* Manual backend selection */
"initialize backend=swarm"
```

### Permission Denied Errors

**Problem:** Cannot execute faas-cli commands

**Solutions:**
```bash
# 1. Check faas-cli installation
which faas-cli
faas-cli version

# 2. Check Docker permissions
docker ps
sudo usermod -a -G docker $USER

# 3. Check OpenFaaS authentication (if enabled)
echo $OPENFAAS_PASSWORD
faas-cli auth --username admin --password $OPENFAAS_PASSWORD
```

### Memory and Resource Issues

**Problem:** Functions fail due to resource constraints

**Solutions:**
```bash
# 1. Check system resources
free -h
docker system df

# 2. Check OpenFaaS resource usage
kubectl top pods -n openfaas  # Kubernetes
docker stats  # Swarm

# 3. Scale down or remove unused functions
faas-cli remove test-func
```

**From RexxJS:**
```rexx
ADDRESS OPENFAAS

/* Cleanup unused functions */
"cleanup all=true"

/* Check system stats */
"process_stats"

/* Deploy with resource limits */
"deploy name=limited image=test:latest memory=128m cpu=100m"
```

### Debugging Tips

```rexx
ADDRESS OPENFAAS

/* Enable verbose logging */
"status"
SAY "Gateway:" OPENFAAS_GATEWAY_URL
SAY "Backend:" OPENFAAS_BACKEND

/* Check REXX variables after failed command */
SAY "Error:" OPENFAAS_ERROR
SAY "Exit code:" OPENFAAS_EXIT_CODE

/* Test basic connectivity */
"verify_backend"

/* Get detailed function info */
"describe name=my-function"
"logs name=my-function lines=100"
```

## Examples

### Complete Serverless Application Setup

```rexx
ADDRESS OPENFAAS

/* 1. Initialize and verify system */
"initialize backend=auto"
"verify_backend"

/* 2. Deploy multiple microservices */
"deploy name=user-service image=myorg/user-api:latest env=DB_URL=postgresql://localhost/users"
"deploy name=auth-service image=myorg/auth-api:latest env=JWT_SECRET=mysecret"
"deploy name=email-service image=myorg/email-worker:latest"

/* 3. Deploy RexxJS business logic */
"deploy_rexx name=order-processor rexx_script_file=/app/order-logic.rexx"

/* 4. Create secrets for production */
"secret_create name=db-password from_literal=prod-password-123"
"secret_create name=api-keys from_file=/secrets/api-keys.json"

/* 5. Setup auto-scaling for high-load services */
"scale name=user-service min=2 max=20"
"scale name=order-processor min=1 max=10"

/* 6. Create development namespace */
"namespace_create name=development"

/* 7. Deploy development versions */
"deploy name=user-service-dev image=myorg/user-api:dev namespace=development"

/* 8. Start monitoring */
"start_monitoring"

/* 9. Test the system */
"invoke name=user-service data='{\"action\": \"list\"}'"
"invoke name=auth-service data='{\"username\": \"test\", \"password\": \"test\"}'"
"invoke_rexx name=order-processor data='{\"order_id\": 12345, \"items\": []}'"

/* 10. Create production snapshot */
"security_audit"
"checkpoint_status"

SAY "Serverless application deployed successfully!"
```

### Event-Driven Processing Pipeline

```rexx
ADDRESS OPENFAAS

/* Deploy event processing pipeline */
"deploy name=webhook-receiver image=myorg/webhook:latest"
"deploy name=data-validator image=myorg/validator:latest"
"deploy_rexx name=business-rules rexx_script_file=/app/rules.rexx"
"deploy name=notification-sender image=myorg/notifications:latest"

/* Configure async processing chain */
"invoke name=webhook-receiver data='{\"event\": \"user_signup\", \"data\": {}}'"
/* This would trigger the processing chain via OpenFaaS connectors */

/* Monitor the pipeline */
"logs name=webhook-receiver lines=20"
"logs name=business-rules lines=20"
"describe name=notification-sender"
```

### Multi-Environment Function Management

```rexx
ADDRESS OPENFAAS

/* Setup environments */
"namespace_create name=staging"
"namespace_create name=production"

/* Deploy to staging */
"deploy name=api-v1 image=myapp:v1.2.3-staging namespace=staging"
"invoke name=api-v1 data='{\"test\": true}'"

/* Promote to production after testing */
"deploy name=api-v1 image=myapp:v1.2.3 namespace=production"
"scale name=api-v1 min=3 max=50"

/* Blue-green deployment */
"deploy name=api-v2 image=myapp:v2.0.0 namespace=production"
/* Test v2, then remove v1 when confident */
"remove name=api-v1"
```