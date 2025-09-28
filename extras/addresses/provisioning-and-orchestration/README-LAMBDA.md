# ADDRESS LAMBDA - AWS Lambda Function Management

RexxJS integration for AWS Lambda serverless function development and deployment.

## Key Features

✅ **Multi-environment support** - Local development (SAM CLI), LocalStack, and AWS Lambda
✅ **Complete function lifecycle** - Create, deploy, invoke, update, version, alias management
✅ **RexxJS integration** - Deploy and execute RexxJS scripts as Lambda functions
✅ **Layer management** - Create, publish, and manage Lambda layers
✅ **Local development** - SAM CLI integration for offline testing
✅ **AWS integration** - Full AWS Lambda API support with CloudWatch logs
✅ **Security policies** - Runtime validation, function limits, audit logging
✅ **Production-ready** - Environment detection, monitoring, error handling

## Quick Comparison: Lambda vs Traditional Servers

| Feature | AWS Lambda | Traditional Servers |
|---------|------------|-------------------|
| **Scaling** | ✅ Auto-scaling (0-∞) | ⚠️ Manual scaling |
| **Pricing** | ✅ Pay per execution | 🐢 Always running costs |
| **Maintenance** | ✅ Serverless (no infra) | 🐢 Server management |
| **Cold starts** | ⚠️ Yes (100-1000ms) | ✅ No cold starts |
| **Execution time** | ⚠️ 15 minute limit | ✅ No time limits |
| **State** | ❌ Stateless only | ✅ Stateful applications |
| **Event-driven** | ✅ Built-in triggers | ⚠️ Manual setup |
| **Best for** | APIs, event processing | Long-running services |

## Environment Comparison: Local vs LocalStack vs AWS

| Feature | Local (SAM) | LocalStack | AWS Lambda |
|---------|-------------|------------|------------|
| **Setup complexity** | 🚀 Simple | ⚡ Medium | 🐢 Complex |
| **Cost** | ✅ Free | ✅ Free | 💰 Pay per use |
| **AWS compatibility** | 🟡 Good | 🟢 Excellent | 🟢 Perfect |
| **Internet required** | ❌ Offline | ❌ Offline | ✅ Online only |
| **Performance** | 🚀 Fast | ⚡ Medium | 🐢 Network latency |
| **Debugging** | 🚀 Easy | ⚡ Medium | 🐢 CloudWatch only |
| **Best for** | Development | Integration testing | Production |

## Basic Usage

```rexx
REQUIRE "rexxjs/address-lambda" AS LAMBDA
ADDRESS LAMBDA

/* Initialize with local development */
"initialize environment=local"

/* Or initialize with AWS */
"initialize environment=aws region=us-east-1 profile=default"

/* Check status */
"status"

/* List functions */
"list"

/* Create and deploy a function */
"create name=hello-python runtime=python3.11 code=/tmp/function.zip handler=index.handler"

/* Invoke function */
"invoke name=hello-python payload={\"name\": \"World\"}"

/* Delete function */
"delete name=hello-python"
```

## Environment Setup

AWS Lambda requires different setup depending on your development environment:

### Local Development with SAM CLI (Recommended for Development)

```bash
# 1. Install AWS SAM CLI
curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o sam.zip
unzip sam.zip -d sam-installation
sudo ./sam-installation/install

# 2. Verify installation
sam --version

# 3. Initialize a sample project (optional)
sam init --runtime python3.11 --name my-lambda-project
```

### LocalStack for Full AWS Simulation

```bash
# 1. Install LocalStack
pip install localstack

# 2. Start LocalStack
localstack start

# 3. Verify LocalStack is running
curl http://localhost:4566/health
```

### AWS Lambda for Production

```bash
# 1. Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 2. Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region, and Output format

# 3. Create IAM role for Lambda (if needed)
aws iam create-role --role-name lambda-execution-role \
  --assume-role-policy-document file://trust-policy.json
```

### Verification

```rexx
ADDRESS LAMBDA

/* Auto-detect and verify environment */
"initialize environment=auto"
"verify_environment"
```

## Function Lifecycle Management

### Local Development Workflow

```rexx
ADDRESS LAMBDA

/* Initialize local environment */
"initialize environment=local"

/* Start local API Gateway */
"local_start_api port=3000"

/* Start local Lambda service */
"local_start_lambda port=3001"

/* Create function from template */
"create name=local-hello runtime=python3.11 handler=app.lambda_handler"

/* Test locally */
"local_invoke name=local-hello event={\"test\": \"data\"}"

/* Package for deployment */
"package name=local-hello code_dir=./hello-function"

/* Stop local services */
"local_stop"
```

### AWS Production Deployment

```rexx
ADDRESS LAMBDA

/* Initialize AWS environment */
"initialize environment=aws region=us-east-1 roleArn=arn:aws:iam::123456789012:role/lambda-role"

/* Create production function */
"create name=prod-hello runtime=python3.11 code=s3://my-bucket/function.zip handler=app.lambda_handler timeout=30 memory=256"

/* Invoke in production */
"invoke name=prod-hello payload={\"production\": true}"

/* Publish version */
"publish_version name=prod-hello description=\"Production release v1.0\""

/* Create production alias */
"create_alias name=prod-hello alias_name=prod version=1"

/* Update function code */
"update name=prod-hello code=s3://my-bucket/function-v2.zip"
```

### Complete Function Lifecycle

```rexx
ADDRESS LAMBDA

/* 1. Create function */
"create name=lifecycle-demo runtime=python3.11 code=/tmp/function.zip handler=lambda_function.lambda_handler timeout=60 memory=512"

/* 2. Test function */
"invoke name=lifecycle-demo payload={\"test\": \"initial\"}"

/* 3. Update configuration */
"update name=lifecycle-demo timeout=120 memory=1024"

/* 4. Update code */
"update name=lifecycle-demo code=/tmp/function-v2.zip"

/* 5. Publish stable version */
"publish_version name=lifecycle-demo description=\"Stable release\""

/* 6. Create aliases for environments */
"create_alias name=lifecycle-demo alias_name=dev version=$LATEST"
"create_alias name=lifecycle-demo alias_name=prod version=1"

/* 7. Scale with environment variables */
"update name=lifecycle-demo environment_vars=ENV=production,DEBUG=false"

/* 8. Monitor and debug */
"logs name=lifecycle-demo lines=100"
"describe name=lifecycle-demo"

/* 9. Clean up when done */
"delete name=lifecycle-demo"
```

## RexxJS Function Deployment

Deploy and execute RexxJS scripts as serverless Lambda functions:

### Simple RexxJS Function

```rexx
ADDRESS LAMBDA

/* Deploy RexxJS function with inline script */
"deploy_rexx name=rexx-hello rexx_script=\"SAY 'Hello from RexxJS Lambda!'; SAY ARG(1)\" runtime=python3.11"

/* Invoke RexxJS function */
"invoke_rexx name=rexx-hello data=\"World\""

/* Response will contain RexxJS output */
```

### RexxJS Function from File

```rexx
ADDRESS LAMBDA

/* Deploy RexxJS function from file */
"deploy_rexx name=rexx-processor rexx_script_file=/project/scripts/data-processor.rexx runtime=python3.11 timeout=300 memory=1024"

/* Invoke with complex data */
"invoke_rexx name=rexx-processor data={\"input\": \"large dataset\", \"format\": \"json\"}"
```

### Advanced RexxJS Integration

```rexx
ADDRESS LAMBDA

/* Deploy RexxJS business logic */
"deploy_rexx name=order-processor rexx_script_file=/business/order-logic.rexx runtime=python3.11"

/* Deploy RexxJS data transformer */
"deploy_rexx name=data-transformer rexx_script_file=/etl/transform.rexx runtime=python3.11 memory=2048"

/* Chain RexxJS functions in workflow */
"invoke_rexx name=data-transformer data={\"raw_data\": \"input\"}"
transformResult = LAMBDA_RESPONSE

"invoke_rexx name=order-processor data=" || transformResult
```

**How RexxJS Lambda Works:**
1. Creates Python wrapper that executes RexxJS binary
2. Packages RexxJS script and binary into Lambda deployment
3. Handles input/output conversion between Lambda JSON and RexxJS
4. Provides error handling and logging
5. Scales automatically with AWS Lambda

## Layer Management

Lambda layers allow you to share code and dependencies across functions:

### Creating Layers

```rexx
ADDRESS LAMBDA

/* Create a Python dependencies layer */
"create_layer name=python-libs content=/tmp/python-layer.zip compatible_runtimes=python3.11,python3.10 description=\"Common Python libraries\""

/* Create a RexxJS utilities layer */
"create_layer name=rexx-utils content=/tmp/rexx-layer.zip compatible_runtimes=python3.11 description=\"RexxJS utility functions\""

/* List available layers */
"list_layers"
```

### Using Layers in Functions

```rexx
ADDRESS LAMBDA

/* Deploy function with layers */
"create name=layered-func runtime=python3.11 code=/tmp/function.zip handler=app.handler layers=arn:aws:lambda:us-east-1:123456789012:layer:python-libs:1,arn:aws:lambda:us-east-1:123456789012:layer:rexx-utils:1"
```

### Layer Versioning

```rexx
ADDRESS LAMBDA

/* Update layer (creates new version) */
"create_layer name=python-libs content=/tmp/python-layer-v2.zip compatible_runtimes=python3.11"

/* Delete old layer version */
"delete_layer name=python-libs version=1"
```

## Version and Alias Management

### Function Versioning

```rexx
ADDRESS LAMBDA

/* Publish numbered versions */
"publish_version name=my-function description=\"Bug fixes\""
version1 = LAMBDA_VERSION

"publish_version name=my-function description=\"New features\""
version2 = LAMBDA_VERSION

/* List function versions */
"list_aliases name=my-function"
```

### Environment Aliases

```rexx
ADDRESS LAMBDA

/* Create environment-specific aliases */
"create_alias name=my-function alias_name=dev version=$LATEST description=\"Development environment\""
"create_alias name=my-function alias_name=staging version=" || version1 || " description=\"Staging environment\""
"create_alias name=my-function alias_name=prod version=" || version2 || " description=\"Production environment\""

/* Invoke specific environment */
"invoke name=my-function:dev payload={\"env\": \"development\"}"
"invoke name=my-function:prod payload={\"env\": \"production\"}"
```

### Blue/Green Deployments

```rexx
ADDRESS LAMBDA

/* Deploy new version */
"update name=api-function code=/tmp/new-version.zip"
"publish_version name=api-function description=\"v2.0.0\""
newVersion = LAMBDA_VERSION

/* Test new version */
"invoke name=api-function:newVersion payload={\"test\": \"v2\"}"

/* Switch production traffic */
"create_alias name=api-function alias_name=prod version=" || newVersion || " description=\"Production v2.0.0\""
```

## Local Development Workflow

### SAM CLI Integration

```rexx
ADDRESS LAMBDA

/* Start local development environment */
"local_start_api port=3000 host=localhost"

/* In another terminal/session */
"local_start_lambda port=3001 host=localhost"

/* Test API Gateway integration locally */
/* Your function is now available at http://localhost:3000/hello */

/* Direct function invocation */
"local_invoke name=HelloWorldFunction event={\"httpMethod\": \"GET\", \"path\": \"/hello\"}"

/* Test with custom event */
"local_invoke name=HelloWorldFunction event=/tmp/test-event.json env_vars=/tmp/env.json"
```

### Local Development with Hot Reload

```rexx
ADDRESS LAMBDA

/* Package and test iteratively */
"package name=dev-function code_dir=./src"
"local_invoke name=dev-function event={\"test\": \"iteration1\"}"

/* Make code changes, then repackage */
"package name=dev-function code_dir=./src"
"local_invoke name=dev-function event={\"test\": \"iteration2\"}"
```

### LocalStack Integration

```rexx
ADDRESS LAMBDA

/* Initialize LocalStack environment */
"initialize environment=localstack localStackEndpoint=http://localhost:4566"

/* Deploy to LocalStack (full AWS API compatibility) */
"create name=localstack-func runtime=python3.11 code=/tmp/function.zip handler=app.handler"

/* Test with LocalStack */
"invoke name=localstack-func payload={\"localstack\": true}"

/* Access LocalStack web UI at http://localhost:4566 */
```

## Advanced Function Configuration

### Environment Variables and Secrets

```rexx
ADDRESS LAMBDA

/* Deploy with environment variables */
"create name=config-func runtime=python3.11 code=/tmp/function.zip handler=app.handler environment_vars=DATABASE_URL=postgres://...,API_KEY=secret123,DEBUG=true"

/* Update environment variables */
"update name=config-func environment_vars=DATABASE_URL=postgres://prod...,DEBUG=false"
```

### VPC and Network Configuration

```rexx
ADDRESS LAMBDA

/* Deploy function in VPC (AWS only) */
"create name=vpc-func runtime=python3.11 code=/tmp/function.zip handler=app.handler vpc_config=SubnetIds=subnet-12345,SecurityGroupIds=sg-12345"
```

### Function with Custom Runtime

```rexx
ADDRESS LAMBDA

/* Deploy with specific runtime version */
"create name=specific-runtime runtime=python3.10 code=/tmp/function.zip handler=app.handler timeout=900 memory=3008"

/* Deploy with custom runtime (provided.al2) */
"create name=custom-runtime runtime=provided.al2 code=/tmp/custom-runtime.zip handler=bootstrap"
```

## Monitoring and Debugging

### Function Logs

```rexx
ADDRESS LAMBDA

/* Get recent logs */
"logs name=my-function lines=50"

/* Get logs with time range */
"logs name=my-function start_time=2025-01-01T00:00:00Z end_time=2025-01-01T23:59:59Z"

/* Follow logs in real-time (placeholder) */
"tail_logs name=my-function follow=true"
```

### Function Metrics

```rexx
ADDRESS LAMBDA

/* Get function details */
"describe name=my-function"

/* Get CloudWatch metrics (placeholder) */
"get_metrics name=my-function start_time=2025-01-01T00:00:00Z end_time=2025-01-01T23:59:59Z period=300"
```

### Performance Monitoring

```rexx
ADDRESS LAMBDA

/* Start performance monitoring */
"start_monitoring"

/* Get performance stats */
"process_stats"

/* Check function health */
"checkpoint_status"

/* Stop monitoring */
"stop_monitoring"
```

## Error Handling and Debugging

### Common Error Scenarios

```rexx
ADDRESS LAMBDA

/* Handle function not found */
result = handleAddressCommand('invoke name=nonexistent')
IF \result.success THEN DO
  SAY "Function not found:" result.error
  /* List available functions */
  "list"
END

/* Handle timeout errors */
result = handleAddressCommand('invoke name=slow-function payload={}')
IF \result.success & POS('timeout', result.error) > 0 THEN DO
  SAY "Function timed out, consider increasing timeout"
  "update name=slow-function timeout=300"
END

/* Handle permission errors */
result = handleAddressCommand('create name=test-func runtime=python3.11 code=/tmp/function.zip')
IF \result.success & POS('role', result.error) > 0 THEN DO
  SAY "Missing IAM role, please configure roleArn"
END
```

### Debug Information

```rexx
ADDRESS LAMBDA

/* Get detailed status */
"status"
SAY "Environment:" LAMBDA_ENVIRONMENT
SAY "Region:" LAMBDA_REGION
SAY "Active functions:" LAMBDA_FUNCTIONS

/* Validate function configuration */
"validate_function name=my-function runtime=python3.11 timeout=30 memory=128"
```

## Security Configuration

### Strict Security Mode

```rexx
ADDRESS LAMBDA

/* Initialize with strict security */
handler = createLambdaHandler({
  securityMode: 'strict',
  allowedRuntimes: ['python3.11', 'nodejs18.x'],
  trustedSources: ['aws', 's3'],
  maxFunctions: 50
})

/* Only whitelisted runtimes can be used */
"create name=safe-func runtime=python3.11 code=/tmp/function.zip handler=index.handler"  /* ✅ Allowed */
"create name=unsafe-func runtime=ruby3.2 code=/tmp/function.zip handler=index.handler"  /* ❌ Blocked */
```

### Permissive Mode (Development)

```rexx
ADDRESS LAMBDA

/* Initialize with permissive security */
handler = createLambdaHandler({
  securityMode: 'permissive'
})

/* Any runtime can be used */
"create name=any-func runtime=go1.x code=/tmp/function.zip handler=main"  /* ✅ Allowed */
```

### Security Auditing

```rexx
ADDRESS LAMBDA

/* Get security audit log */
"security_audit"

/* Check security policies */
policies = LAMBDA_POLICIES
SAY "Security mode:" policies.securityMode
SAY "Max functions:" policies.maxFunctions
```

## Bulk Operations and Automation

### Function Management

```rexx
ADDRESS LAMBDA

/* List functions with filters */
"list runtime=python3.11"
"list prefix=api-"

/* Bulk cleanup */
"cleanup all=true"
"cleanup prefix=test-"
"cleanup runtime=python3.10"
```

### Automated Deployment Pipeline

```rexx
ADDRESS LAMBDA

/* CI/CD deployment pipeline */
"package name=api-function code_dir=./build"
"update name=api-function code=./build/function.zip"
"publish_version name=api-function description=\"Build #" || buildNumber || "\""
newVersion = LAMBDA_VERSION

/* Test new version */
"invoke name=api-function:" || newVersion || " payload={\"test\": true}"
IF LAMBDA_EXIT_CODE = 0 THEN DO
  /* Promote to production */
  "create_alias name=api-function alias_name=prod version=" || newVersion
  SAY "Deployed version" newVersion "to production"
END
ELSE DO
  SAY "Deployment failed, keeping current version"
END
```

## Available Commands

### Function Lifecycle
| Command | Description | Parameters |
|---------|-------------|------------|
| `status` | Get handler and environment status | none |
| `list` | List Lambda functions | `runtime`, `prefix` |
| `create` | Create new Lambda function | `name`, `runtime`, `code`, `handler`, `role`, `timeout`, `memory`, `description` |
| `deploy` | Deploy/update Lambda function | `name`, `code`, `runtime`, `handler`, `role`, `environment_vars`, `layers`, `vpc_config` |
| `invoke` | Invoke Lambda function | `name`, `payload`, `invocation_type`, `log_type` |
| `update` | Update function code or configuration | `name`, `code`, `runtime`, `handler`, `environment_vars`, `timeout`, `memory`, `layers` |
| `remove` / `delete` | Delete Lambda function | `name`, `qualifier` |
| `describe` / `get_function` | Get function details | `name`, `qualifier` |
| `logs` | Get function logs | `name`, `lines`, `follow`, `start_time`, `end_time` |

### Versioning and Aliases
| Command | Description | Parameters |
|---------|-------------|------------|
| `publish_version` | Publish function version | `name`, `description` |
| `create_alias` | Create function alias | `name`, `alias_name`, `version`, `description` |
| `list_aliases` | List function aliases | `name` |

### Layer Management
| Command | Description | Parameters |
|---------|-------------|------------|
| `create_layer` | Create Lambda layer | `name`, `content`, `compatible_runtimes`, `description` |
| `list_layers` | List Lambda layers | none |
| `delete_layer` | Delete layer version | `name`, `version` |

### Local Development
| Command | Description | Parameters |
|---------|-------------|------------|
| `local_start_api` | Start local API Gateway | `port`, `host` |
| `local_start_lambda` | Start local Lambda service | `port`, `host` |
| `local_invoke` | Invoke function locally | `name`, `event`, `env_vars` |
| `local_stop` | Stop local services | none |
| `package` | Package function code | `name`, `code_dir`, `output_dir`, `runtime` |

### RexxJS Integration
| Command | Description | Parameters |
|---------|-------------|------------|
| `deploy_rexx` | Deploy RexxJS function | `name`, `rexx_script` or `rexx_script_file`, `runtime`, `timeout`, `memory` |
| `invoke_rexx` | Invoke RexxJS function | `name`, `data` |

### Triggers and Events (Placeholders)
| Command | Description | Parameters |
|---------|-------------|------------|
| `create_trigger` | Create function trigger | `name`, `source`, `source_arn`, `event_source_mapping` |
| `list_triggers` | List function triggers | `name` |
| `delete_trigger` | Delete function trigger | `name`, `trigger_id` |

### Monitoring and Administration
| Command | Description | Parameters |
|---------|-------------|------------|
| `get_metrics` | Get function metrics | `name`, `start_time`, `end_time`, `period` |
| `tail_logs` | Tail function logs | `name`, `follow` |
| `validate_function` | Validate function configuration | `name`, `runtime`, `handler`, `timeout`, `memory` |
| `cleanup` | Remove functions | `all`, `prefix`, `runtime` |
| `security_audit` | Get security audit log | none |
| `process_stats` | Get process statistics | none |
| `start_monitoring` | Start process monitoring | none |
| `stop_monitoring` | Stop process monitoring | none |
| `checkpoint_status` | Get checkpoint status | none |
| `verify_environment` | Verify environment setup | none |

## REXX Variables

After each operation, these variables are set:

- `LAMBDA_OPERATION` - The operation performed
- `LAMBDA_FUNCTION` - Function name
- `LAMBDA_STATUS` - Operation status
- `LAMBDA_RESPONSE` - Function response or command result
- `LAMBDA_ERROR` - Error message (if failed)
- `LAMBDA_ENVIRONMENT` - Current environment (local/aws/localstack)
- `LAMBDA_REGION` - AWS region
- `LAMBDA_VERSION` - Function version (for publish_version)
- `LAMBDA_EXIT_CODE` - Command exit code

## Requirements

### Host System Requirements

**Essential packages:**
- **AWS CLI** - AWS command line interface
- **SAM CLI** - AWS Serverless Application Model CLI (for local development)
- **Docker** - Container runtime (required by SAM CLI)

**Installation commands:**

**Install AWS CLI:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

**Install SAM CLI:**
```bash
curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o sam.zip
unzip sam.zip -d sam-installation
sudo ./sam-installation/install
sam --version
```

**Install Docker:**
```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo usermod -a -G docker $USER
# Logout and login again
```

**Optional - Install LocalStack:**
```bash
pip install localstack
# Or via Docker
docker pull localstack/localstack
```

### AWS Configuration

For AWS Lambda (production) environment:

```bash
# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g., us-east-1), Output format (json)

# Create Lambda execution role (if needed)
aws iam create-role --role-name lambda-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### Permissions

User must have access to:
- AWS CLI with valid credentials (for AWS environment)
- Docker daemon (member of `docker` group)
- SAM CLI command
- Local filesystem for function packaging

```bash
sudo usermod -a -G docker $USER
# Logout and login again for changes to take effect
```

### Lambda Function Requirements

**For AWS Lambda:**
- Valid IAM execution role with Lambda permissions
- Function code packaged as ZIP file or uploaded to S3
- Compatible runtime version

**For Local development:**
- SAM template (template.yaml) for function definition
- Function code in local directory structure
- Docker for containerized execution

**For RexxJS functions:**
- RexxJS binary (automatically packaged)
- Valid RexxJS script content
- Python runtime (wrapper language)

### Verification

Run verification to check all requirements:
```rexx
ADDRESS LAMBDA
"verify_environment"
```

This checks:
- AWS CLI installation and configuration
- SAM CLI availability
- Docker installation and access
- LocalStack connectivity (if configured)
- Basic Lambda operations

## Security

The handler enforces configurable security policies:

- **Runtime validation** - Whitelist allowed Lambda runtimes
- **Function limits** - Maximum number of deployed functions
- **Source validation** - Trusted code sources (AWS, S3, local)
- **Audit logging** - Track all operations and security events
- **Environment isolation** - Separate local/AWS/LocalStack configurations

### Security Modes

**Strict Mode (Production):**
```javascript
{
  securityMode: 'strict',
  allowedRuntimes: new Set(['python3.11', 'nodejs18.x']),
  trustedSources: new Set(['aws', 's3']),
  maxFunctions: 50
}
```

**Permissive Mode (Development):**
```javascript
{
  securityMode: 'permissive'
  // All runtimes and sources allowed
}
```

## Troubleshooting

### AWS CLI Issues

**Problem:** AWS CLI not configured or invalid credentials

**Solutions:**
```bash
# 1. Check AWS configuration
aws configure list
aws sts get-caller-identity

# 2. Reconfigure credentials
aws configure

# 3. Check IAM permissions
aws iam list-attached-role-policies --role-name lambda-execution-role
```

**From RexxJS:**
```rexx
ADDRESS LAMBDA
"verify_environment"
```

### SAM CLI Issues

**Problem:** SAM CLI commands fail

**Solutions:**
```bash
# 1. Check SAM installation
sam --version

# 2. Check Docker is running
docker ps

# 3. Build SAM application
sam build

# 4. Check template.yaml syntax
sam validate
```

**From RexxJS:**
```rexx
ADDRESS LAMBDA

/* Test local environment */
"initialize environment=local"
"local_invoke name=test-function"
```

### Function Deployment Fails

**Problem:** Function creation or deployment fails

**Solutions:**
```bash
# 1. Check IAM role exists and is valid
aws iam get-role --role-name lambda-execution-role

# 2. Check function package
unzip -l /tmp/function.zip

# 3. Check runtime compatibility
aws lambda list-layers --compatible-runtime python3.11

# 4. Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/
```

**From RexxJS:**
```rexx
ADDRESS LAMBDA

/* Validate function before deployment */
"validate_function name=my-function runtime=python3.11 timeout=30 memory=128"

/* Check function details */
"describe name=my-function"

/* Check function logs */
"logs name=my-function lines=50"
```

### Function Invocation Fails

**Problem:** Function invocations timeout or return errors

**Solutions:**
```bash
# 1. Check function status
aws lambda get-function --function-name my-function

# 2. Test with AWS CLI
aws lambda invoke --function-name my-function --payload '{}' response.json

# 3. Check CloudWatch logs
aws logs tail /aws/lambda/my-function
```

**From RexxJS:**
```rexx
ADDRESS LAMBDA

/* Check function configuration */
"describe name=my-function"

/* Test with simple payload */
"invoke name=my-function payload={}"

/* Check recent logs */
"logs name=my-function lines=20"
```

### LocalStack Issues

**Problem:** LocalStack not accessible or functions fail

**Solutions:**
```bash
# 1. Check LocalStack status
curl http://localhost:4566/health

# 2. Restart LocalStack
localstack stop
localstack start

# 3. Check LocalStack logs
docker logs localstack_main
```

**From RexxJS:**
```rexx
ADDRESS LAMBDA

/* Switch to LocalStack environment */
"initialize environment=localstack"
"verify_environment"
```

### Permission Denied Errors

**Problem:** Cannot execute AWS CLI or Lambda operations

**Solutions:**
```bash
# 1. Check AWS credentials
aws configure list

# 2. Check IAM user permissions
aws iam list-attached-user-policies --user-name your-username

# 3. Check Docker permissions
groups $USER | grep docker
sudo usermod -a -G docker $USER

# 4. Check file permissions
ls -la ~/.aws/
chmod 600 ~/.aws/credentials
```

### RexxJS Deployment Issues

**Problem:** `deploy_rexx` or `invoke_rexx` fails

**Solutions:**
```rexx
ADDRESS LAMBDA

/* Check RexxJS script syntax */
"validate_function name=rexx-func runtime=python3.11"

/* Test with simple script */
"deploy_rexx name=test-rexx rexx_script=\"SAY 'Hello'\" runtime=python3.11"

/* Check function logs */
"logs name=test-rexx lines=50"

/* Redeploy with different runtime */
"deploy_rexx name=test-rexx rexx_script=\"SAY 'Hello'\" runtime=python3.10"
```

### Memory and Timeout Issues

**Problem:** Functions run out of memory or time out

**Solutions:**
```rexx
ADDRESS LAMBDA

/* Increase function resources */
"update name=my-function timeout=300 memory=1024"

/* Check function metrics */
"get_metrics name=my-function start_time=2025-01-01T00:00:00Z"

/* Optimize function configuration */
"validate_function name=my-function timeout=300 memory=1024"
```

### Debugging Tips

```rexx
ADDRESS LAMBDA

/* Enable verbose logging */
"status"
SAY "Environment:" LAMBDA_ENVIRONMENT
SAY "Region:" LAMBDA_REGION

/* Check REXX variables after failed command */
SAY "Error:" LAMBDA_ERROR
SAY "Exit code:" LAMBDA_EXIT_CODE

/* Test environment connectivity */
"verify_environment"

/* Get detailed function info */
"describe name=my-function"
"logs name=my-function lines=100"
```

## Examples

### Complete Serverless Application

```rexx
ADDRESS LAMBDA

/* 1. Initialize and verify environment */
"initialize environment=aws region=us-east-1 roleArn=arn:aws:iam::123456789012:role/lambda-role"
"verify_environment"

/* 2. Create application layers */
"create_layer name=common-utils content=/tmp/utils-layer.zip compatible_runtimes=python3.11 description=\"Common utility functions\""
utilsLayerArn = LAMBDA_LAYER_ARN

/* 3. Deploy microservices */
"create name=user-service runtime=python3.11 code=/tmp/user-service.zip handler=app.handler layers=" || utilsLayerArn || " environment_vars=DB_URL=postgresql://prod/users,JWT_SECRET=secret123"
"create name=auth-service runtime=python3.11 code=/tmp/auth-service.zip handler=app.handler layers=" || utilsLayerArn || " environment_vars=JWT_SECRET=secret123"
"create name=notification-service runtime=python3.11 code=/tmp/notification.zip handler=app.handler layers=" || utilsLayerArn

/* 4. Deploy RexxJS business logic */
"deploy_rexx name=order-processor rexx_script_file=/business/order-logic.rexx runtime=python3.11 timeout=300 memory=1024"
"deploy_rexx name=inventory-manager rexx_script_file=/business/inventory.rexx runtime=python3.11"

/* 5. Publish stable versions */
"publish_version name=user-service description=\"Production release\""
userServiceVersion = LAMBDA_VERSION
"publish_version name=auth-service description=\"Production release\""
authServiceVersion = LAMBDA_VERSION

/* 6. Create production aliases */
"create_alias name=user-service alias_name=prod version=" || userServiceVersion
"create_alias name=auth-service alias_name=prod version=" || authServiceVersion

/* 7. Test the system */
"invoke name=auth-service:prod payload={\"username\": \"test\", \"password\": \"password\"}"
authResult = LAMBDA_RESPONSE

"invoke name=user-service:prod payload={\"action\": \"list\", \"auth\": " || authResult || "}"
"invoke_rexx name=order-processor data={\"order_id\": 12345, \"items\": [], \"user_id\": 1}"

/* 8. Start monitoring */
"start_monitoring"

/* 9. Get system status */
"list"
"process_stats"

SAY "Serverless application deployed successfully!"
```

### Local Development to Production Pipeline

```rexx
ADDRESS LAMBDA

/* 1. Local development */
"initialize environment=local"
"local_start_api port=3000"

/* Develop and test locally */
"package name=my-api code_dir=./src"
"local_invoke name=my-api event={\"httpMethod\": \"GET\", \"path\": \"/users\"}"

/* 2. Integration testing with LocalStack */
"initialize environment=localstack"
"create name=my-api runtime=python3.11 code=./build/function.zip handler=app.handler"
"invoke name=my-api payload={\"integration\": \"test\"}"

/* 3. Deploy to AWS staging */
"initialize environment=aws region=us-east-1 roleArn=arn:aws:iam::123456789012:role/lambda-role"
"create name=my-api-staging runtime=python3.11 code=s3://staging-bucket/function.zip handler=app.handler environment_vars=ENV=staging"

/* Test staging */
"invoke name=my-api-staging payload={\"staging\": \"test\"}"
IF LAMBDA_EXIT_CODE = 0 THEN DO
  SAY "Staging tests passed!"

  /* 4. Deploy to production */
  "create name=my-api-prod runtime=python3.11 code=s3://prod-bucket/function.zip handler=app.handler environment_vars=ENV=production"
  "publish_version name=my-api-prod description=\"Release v1.0.0\""
  "create_alias name=my-api-prod alias_name=prod version=1"

  SAY "Production deployment complete!"
END
ELSE DO
  SAY "Staging tests failed, aborting deployment"
END
```

### Event-Driven Architecture

```rexx
ADDRESS LAMBDA

/* Deploy event processing functions */
"create name=s3-processor runtime=python3.11 code=/tmp/s3-handler.zip handler=s3_handler.handler"
"create name=dynamodb-stream runtime=python3.11 code=/tmp/db-handler.zip handler=db_handler.handler"
"deploy_rexx name=business-rules rexx_script_file=/rules/validation.rexx runtime=python3.11"

/* Create triggers (would integrate with AWS event sources) */
"create_trigger name=s3-processor source=s3 source_arn=arn:aws:s3:::my-bucket"
"create_trigger name=dynamodb-stream source=dynamodb source_arn=arn:aws:dynamodb:us-east-1:123456789012:table/Orders/stream"

/* Test event processing */
"invoke name=s3-processor payload={\"Records\": [{\"s3\": {\"bucket\": {\"name\": \"my-bucket\"}, \"object\": {\"key\": \"test.json\"}}}]}"
"invoke_rexx name=business-rules data={\"event\": \"order_created\", \"order\": {}}"

/* Monitor event processing */
"logs name=s3-processor lines=50"
"logs name=business-rules lines=50"
```

### Multi-Environment RexxJS Deployment

```rexx
ADDRESS LAMBDA

/* Deploy RexxJS functions across environments */

/* Development */
"initialize environment=local"
"deploy_rexx name=data-processor rexx_script_file=/dev/processor.rexx runtime=python3.11"
"local_invoke name=data-processor event={\"test_data\": \"development\"}"

/* Staging */
"initialize environment=aws region=us-east-1"
"deploy_rexx name=data-processor-staging rexx_script_file=/staging/processor.rexx runtime=python3.11 timeout=300"
"invoke_rexx name=data-processor-staging data={\"test_data\": \"staging\"}"

/* Production */
"deploy_rexx name=data-processor-prod rexx_script_file=/prod/processor.rexx runtime=python3.11 timeout=600 memory=2048"
"publish_version name=data-processor-prod description=\"Production RexxJS processor\""
"create_alias name=data-processor-prod alias_name=prod version=1"

/* Production invocation */
"invoke_rexx name=data-processor-prod:prod data={\"production_data\": \"real_workload\"}"

SAY "Multi-environment RexxJS deployment complete!"
```