#!/bin/bash
# Build and push hello-world container to GCR
# Uses Cloud Build (no local Docker needed)

set -e

PROJECT_ID="${1:-tribal-quasar-473615-a4}"
IMAGE_NAME="cloudrun-hello"
TAG="${2:-v1}"

echo "Building ${IMAGE_NAME}:${TAG} for project ${PROJECT_ID}..."
echo ""

# Use Cloud Build (free tier: 120 build-minutes/day)
gcloud builds submit \
  --tag "gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}" \
  --project "${PROJECT_ID}" \
  .

echo ""
echo "✓ Image pushed to: gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}"
echo ""
echo "Deploy with:"
echo "  gcloud run deploy ${IMAGE_NAME} \\"
echo "    --image gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG} \\"
echo "    --region us-central1 \\"
echo "    --allow-unauthenticated"
echo ""
echo "Or use RexxJS test script: test-cloudrun-hello.rexx"
