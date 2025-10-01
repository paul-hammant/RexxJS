# Human Actions Required

This file tracks actions that require human intervention (browser, GUI, manual steps).

## Cloud Billing API - Enable in GCP Console

**Status**: ⏳ Waiting for human action

**What**: Enable Cloud Billing API for the project

**Why**: The BillingHandler needs this API enabled to query billing status, accounts, and project billing configuration.

**Error Message**:
```
PERMISSION_DENIED: Cloud Billing API has not been used in project 759131345761
before or it is disabled. Enable it by visiting
https://console.developers.google.com/apis/api/cloudbilling.googleapis.com/overview?project=759131345761
```

**Steps**:
1. Walk to the machine with Chrome and a screen
2. Visit: https://console.developers.google.com/apis/api/cloudbilling.googleapis.com/overview?project=759131345761
3. Click "Enable" button
4. Wait a few minutes for the action to propagate
5. Re-run test: `node core/src/rexxjs-cli.js extras/addresses/provisioning-and-orchestration/examples/gcp/test-billing-status.rexx`

**Alternative Link** (if project ID differs):
- Go to: https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com?project=tribal-quasar-473615-a4
- Click "Enable"

**After Enabling**:
The test script should show:
- Billing account ID
- Billing enabled status
- List of accessible billing accounts
- Your $300 credits status (with 24h lag)

**Priority**: Low (billing queries work for daily monitoring, not critical for development)

**Related Files**:
- `extras/addresses/provisioning-and-orchestration/gcp-handlers/billing-handler.js`
- `extras/addresses/provisioning-and-orchestration/examples/gcp/test-billing-status.rexx`

---

## Cloud Run API - Enable in GCP Console

**Status**: ⏳ Waiting for human action

**What**: Enable Cloud Run API for the project

**Why**: Required to deploy and manage Cloud Run services from RexxJS.

**Steps**:
1. Walk to machine with Chrome
2. Visit: https://console.cloud.google.com/apis/library/run.googleapis.com?project=tribal-quasar-473615-a4
3. Click "Enable" button
4. Wait a few minutes for propagation
5. Run test: `node core/src/rexxjs-cli.js extras/addresses/provisioning-and-orchestration/examples/gcp/test-cloudrun-hello.rexx`

**Also Enable Cloud Build API** (for container builds):
- Visit: https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=tribal-quasar-473615-a4
- Click "Enable"

**Priority**: Medium (needed for Cloud Run hello-world test)

**Cost Note**: Cloud Run deployment itself is FREE within generous free tier:
- 2M requests/month
- 360k vCPU-seconds/month
- 180k GiB-seconds/month
- Hello-world test = $0.00

**Related Files**:
- `extras/addresses/provisioning-and-orchestration/examples/gcp/test-cloudrun-hello.rexx`
- `extras/addresses/provisioning-and-orchestration/examples/gcp/cloudrun-hello/`

---

## Notes
- Add new human actions above this line
- Mark completed actions with ✅
- Mark blocked actions with 🚫
