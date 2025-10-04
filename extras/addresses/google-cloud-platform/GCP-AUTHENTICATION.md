# Google Cloud Platform Authentication for RexxJS

This document covers authentication and authorization requirements for using the GCP ADDRESS handler with RexxJS.

## Overview

The GCP ADDRESS handler uses the Google Cloud CLI (`gcloud`) which handles authentication through several methods:

1. **User Credentials** - For development and testing
2. **Service Account Keys** - For production and CI/CD
3. **Application Default Credentials (ADC)** - Automatic credential discovery
4. **Workload Identity** - For GKE and other Google Cloud services

## Development Setup (Local Machine)

### 1. Install Google Cloud CLI

```bash
# Linux/macOS
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Verify installation
gcloud --version
```

### 2. Initialize and Authenticate

```bash
# Initialize gcloud (interactive setup)
gcloud init

# Or set up manually
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud config set compute/region us-central1
```

### 3. Set Application Default Credentials

```bash
# Required for programmatic access
gcloud auth application-default login
```

### 4. Enable Required APIs

```bash
# Enable all GCP services used by RexxJS scripts
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 5. Verify Setup

```bash
# Check authentication status
gcloud auth list

# Check project configuration
gcloud config list

# Test API access
gcloud projects describe YOUR_PROJECT_ID
```

## Required IAM Roles

Your user account or service account needs these IAM roles:

### Cloud Functions
```
roles/cloudfunctions.admin      # Deploy, update, delete functions
roles/cloudfunctions.invoker    # Invoke functions
roles/storage.admin             # Access source code in Cloud Storage
roles/logging.viewer            # View function logs
```

### Cloud Run
```
roles/run.admin                 # Deploy, update, delete services
roles/run.invoker              # Invoke services
roles/storage.admin            # Access container images
roles/cloudbuild.builds.editor # Build container images
```

### Cloud Storage
```
roles/storage.admin            # Full storage access
# OR more granular:
roles/storage.objectAdmin      # Object-level access
roles/storage.bucketAdmin      # Bucket-level access
```

### Pub/Sub
```
roles/pubsub.admin             # Create topics, subscriptions
roles/pubsub.publisher         # Publish messages
roles/pubsub.subscriber        # Receive messages
```

### Container Registry
```
roles/storage.admin            # Container Registry uses Cloud Storage
# OR more specific:
roles/storage.objectViewer     # Pull images
roles/storage.objectCreator    # Push images
```

### Minimal Role Assignment

```bash
# Assign roles to your user account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="user:your-email@domain.com" \
    --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="user:your-email@domain.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="user:your-email@domain.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="user:your-email@domain.com" \
    --role="roles/pubsub.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="user:your-email@domain.com" \
    --role="roles/cloudbuild.builds.editor"
```

## Production Setup (Service Accounts)

### 1. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create rexxjs-gcp-handler \
    --description="Service account for RexxJS GCP operations" \
    --display-name="RexxJS GCP Handler"

# Get service account email
SA_EMAIL=$(gcloud iam service-accounts list \
    --filter="displayName:RexxJS GCP Handler" \
    --format="value(email)")

echo "Service Account: $SA_EMAIL"
```

### 2. Assign IAM Roles

```bash
# Assign required roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/pubsub.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudbuild.builds.editor"
```

### 3. Create and Download Key

```bash
# Create service account key
gcloud iam service-accounts keys create ~/rexxjs-gcp-key.json \
    --iam-account=$SA_EMAIL

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=~/rexxjs-gcp-key.json
```

### 4. Activate Service Account

```bash
# Activate service account
gcloud auth activate-service-account $SA_EMAIL \
    --key-file=~/rexxjs-gcp-key.json

# Set as default
gcloud config set account $SA_EMAIL
```

## Environment Variables

The GCP ADDRESS handler respects these environment variables:

```bash
# Primary authentication
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Project configuration
export GOOGLE_CLOUD_PROJECT=your-project-id
export GCLOUD_PROJECT=your-project-id  # Alternative

# Region configuration
export GOOGLE_CLOUD_REGION=us-central1

# Additional options
export CLOUDSDK_CORE_DISABLE_PROMPTS=1  # Non-interactive mode
export CLOUDSDK_PYTHON_SITEPACKAGES=1   # Python compatibility
```

## Docker Authentication (for Cloud Run)

### Configure Docker for GCR

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker

# For Artifact Registry (newer)
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Verify Docker Authentication

```bash
# Test pushing to Container Registry
docker tag hello-world gcr.io/YOUR_PROJECT_ID/test
docker push gcr.io/YOUR_PROJECT_ID/test
```

## CI/CD Setup

### GitHub Actions Example

```yaml
name: Deploy to GCP
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup Google Cloud CLI
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        export_default_credentials: true

    - name: Configure Docker
      run: gcloud auth configure-docker

    - name: Deploy with RexxJS
      run: |
        cd extras/addresses/provisioning-and-orchestration
        ../../../core/rexx hello-gcp-cloudrun.rexx
```

### GitLab CI Example

```yaml
deploy_gcp:
  image: google/cloud-sdk:latest
  script:
    - echo $GCP_SA_KEY | base64 -d > service-account-key.json
    - gcloud auth activate-service-account --key-file service-account-key.json
    - gcloud config set project $GCP_PROJECT_ID
    - gcloud auth configure-docker
    - cd extras/addresses/provisioning-and-orchestration
    - ../../../core/rexx hello-gcp-cloudrun.rexx
  variables:
    GOOGLE_APPLICATION_CREDENTIALS: ./service-account-key.json
```

## Troubleshooting Authentication

### Check Current Authentication

```bash
# List authenticated accounts
gcloud auth list

# Show current configuration
gcloud config list

# Test authentication
gcloud auth print-access-token
```

### Common Issues and Solutions

**"gcloud: command not found"**
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
source ~/.bashrc
```

**"User does not have permission"**
```bash
# Check IAM roles
gcloud projects get-iam-policy YOUR_PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:user:YOUR_EMAIL"
```

**"Application Default Credentials not found"**
```bash
# Set up ADC
gcloud auth application-default login

# Or set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**"API not enabled"**
```bash
# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services list --enabled
```

**"Docker authentication failed"**
```bash
# Reconfigure Docker authentication
gcloud auth configure-docker --quiet

# Test with simple push
docker tag alpine gcr.io/YOUR_PROJECT_ID/test
docker push gcr.io/YOUR_PROJECT_ID/test
```

**"Project not found"**
```bash
# List available projects
gcloud projects list

# Set correct project
gcloud config set project YOUR_PROJECT_ID
```

### Debug Mode

Enable debug logging:

```bash
# Enable gcloud debug output
export CLOUDSDK_CORE_VERBOSITY=debug

# Run RexxJS script with debug
../../../core/rexx hello-gcp.rexx
```

## Security Best Practices

### 1. Principle of Least Privilege
- Grant only the minimum required roles
- Use predefined roles instead of primitive roles when possible
- Regularly audit and rotate service account keys

### 2. Service Account Key Management
```bash
# Rotate service account keys regularly
gcloud iam service-accounts keys create new-key.json \
    --iam-account=SERVICE_ACCOUNT_EMAIL

# Delete old keys
gcloud iam service-accounts keys delete KEY_ID \
    --iam-account=SERVICE_ACCOUNT_EMAIL
```

### 3. Environment Isolation
```bash
# Use different service accounts for different environments
gcloud iam service-accounts create rexxjs-dev
gcloud iam service-accounts create rexxjs-staging
gcloud iam service-accounts create rexxjs-prod
```

### 4. Workload Identity (GKE)
```bash
# Create Kubernetes service account
kubectl create serviceaccount rexxjs-ksa

# Bind to Google service account
gcloud iam service-accounts add-iam-policy-binding \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:PROJECT_ID.svc.id.goog[NAMESPACE/rexxjs-ksa]" \
    SERVICE_ACCOUNT_EMAIL

# Annotate Kubernetes service account
kubectl annotate serviceaccount rexxjs-ksa \
    iam.gke.io/gcp-service-account=SERVICE_ACCOUNT_EMAIL
```

## RexxJS Integration

The GCP ADDRESS handler automatically detects authentication:

```rexx
#!/usr/bin/env rexx
/* The handler automatically uses available credentials */

REQUIRE "address-gcp.js"
ADDRESS GCP

/* Handler will use credentials in this order:
   1. GOOGLE_APPLICATION_CREDENTIALS environment variable
   2. gcloud user credentials
   3. Google Cloud metadata service (if running on GCP)
   4. Error if no credentials found
*/

LET result = handle method="info"
SAY "Authenticated project: " || result.project
```

## Quick Setup Script

Save this as `setup-gcp-auth.sh`:

```bash
#!/bin/bash
set -e

PROJECT_ID=${1:-""}
if [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 PROJECT_ID"
    exit 1
fi

echo "Setting up GCP authentication for RexxJS..."

# Install gcloud if not present
if ! command -v gcloud &> /dev/null; then
    echo "Installing Google Cloud CLI..."
    curl https://sdk.cloud.google.com | bash
    source ~/.bashrc
fi

# Authenticate and set project
gcloud auth login
gcloud config set project $PROJECT_ID
gcloud config set compute/region us-central1

# Set up Application Default Credentials
gcloud auth application-default login

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Configure Docker
gcloud auth configure-docker --quiet

echo "✅ GCP authentication setup complete!"
echo "Project: $PROJECT_ID"
echo "You can now run RexxJS GCP scripts."
```

Make it executable and run:
```bash
chmod +x setup-gcp-auth.sh
./setup-gcp-auth.sh your-project-id
```