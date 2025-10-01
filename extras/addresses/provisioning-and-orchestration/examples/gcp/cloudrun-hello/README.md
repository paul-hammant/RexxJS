# Cloud Run Hello World

Minimal Node.js service for testing Cloud Run deployment from RexxJS.

## Files

- `app.js` - Simple HTTP server that returns JSON
- `Dockerfile` - Container definition
- `build-and-push.sh` - Helper script to build and push to GCR

## Manual Build & Deploy (for testing)

```bash
# Set your project
PROJECT_ID="tribal-quasar-473615-a4"

# Build and push to Google Container Registry
docker build -t gcr.io/${PROJECT_ID}/cloudrun-hello:v1 .
docker push gcr.io/${PROJECT_ID}/cloudrun-hello:v1

# Or use Cloud Build (no local Docker needed)
gcloud builds submit --tag gcr.io/${PROJECT_ID}/cloudrun-hello:v1
```

## Deploy via RexxJS

See `test-cloudrun-hello.rexx` in parent directory.

## Estimated Costs

**Free Tier (per month):**
- 2 million requests FREE
- 360,000 vCPU-seconds FREE
- 180,000 GiB-seconds FREE

**This hello-world service:**
- ~50ms response time
- ~128MB memory
- **~100,000 requests = $0.00** (within free tier)
- **1 million requests = $0.04** (mostly free tier)

**To stay FREE:**
- Use `--min-instances=0` (default)
- Delete after testing
- Monitor with: `gcloud run services describe cloudrun-hello`
