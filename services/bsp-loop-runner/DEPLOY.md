# BSP Autonomous Loops — Deployment Guide

Two Cloud Run jobs that power Nouvia's autonomous intelligence system.

## Architecture Overview

```
Cloud Scheduler
  ├── 28th of month, 6 AM ET → sentinel-reporter
  │     └── Reads: Cloud Logging, Firestore (platform data)
  │     └── Writes: Firestore sentinel_reports collection
  │
  ├── 1st of month, 7 AM ET → bsp-loop-runner (monthly)
  │     └── Reads: Firestore (canvas, cockpit, sentinel_reports, coworkers, experiments)
  │     └── Writes: Firestore (experiments, capability_gaps)
  │     └── Sends: Monthly OS Health digest to Ben
  │
  └── Every Monday, 6 AM ET → bsp-loop-runner (weekly)
        └── Reads: Firestore (canvas) + web search
        └── Writes: Firestore (trends)
        └── Sends: Weekly Market Scan digest to Ben
```

**Key sequencing:** Sentinel runs on the 28th so its data is available when the
monthly BSP loop runs on the 1st. This gives a 3-day buffer.

## Prerequisites

- GCP project: `nouvia-os`
- gcloud CLI authenticated with project access
- Anthropic API key
- BSP MCP server deployed (existing: `nouvia-strategist-mcp-*.run.app`)
- Service account with roles:
  - `roles/logging.viewer` (read Cloud Logging)
  - `roles/datastore.user` (read/write Firestore)
  - `roles/run.invoker` (trigger Cloud Run jobs)
  - `roles/secretmanager.secretAccessor` (read API keys)

## Step 1: Store Secrets

```bash
# Anthropic API key
echo -n "sk-ant-your-key-here" | gcloud secrets create anthropic-api-key \
  --project=nouvia-os \
  --replication-policy="automatic" \
  --data-file=-

# Grant the Cloud Run service account access
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --project=nouvia-os \
  --member="serviceAccount:bsp-runner@nouvia-os.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 2: Create Service Account

```bash
gcloud iam service-accounts create bsp-runner \
  --project=nouvia-os \
  --display-name="BSP Loop Runner"

# Grant required roles
for ROLE in roles/logging.viewer roles/datastore.user roles/run.invoker; do
  gcloud projects add-iam-policy-binding nouvia-os \
    --member="serviceAccount:bsp-runner@nouvia-os.iam.gserviceaccount.com" \
    --role="$ROLE"
done
```

## Step 3: Deploy Sentinel Reporter

```bash
cd sentinel-reporter

# Build and push
gcloud builds submit --tag gcr.io/nouvia-os/sentinel-reporter:latest \
  --project=nouvia-os

# Create Cloud Run job
gcloud run jobs create sentinel-reporter \
  --project=nouvia-os \
  --region=us-central1 \
  --image=gcr.io/nouvia-os/sentinel-reporter:latest \
  --service-account=bsp-runner@nouvia-os.iam.gserviceaccount.com \
  --memory=512Mi \
  --cpu=1 \
  --max-retries=1 \
  --task-timeout=300s \
  --set-env-vars="BSP_PROJECT=nouvia-os"

# Schedule: 28th of each month at 6 AM ET
gcloud scheduler jobs create http sentinel-reporter-monthly \
  --project=nouvia-os \
  --location=us-central1 \
  --schedule="0 6 28 * *" \
  --time-zone="America/New_York" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/nouvia-os/jobs/sentinel-reporter:run" \
  --http-method=POST \
  --oauth-service-account-email=bsp-runner@nouvia-os.iam.gserviceaccount.com
```

## Step 4: Deploy BSP Loop Runner

```bash
cd bsp-runner-deploy

# Build and push
gcloud builds submit --tag gcr.io/nouvia-os/bsp-loop-runner:latest \
  --project=nouvia-os

# Create Cloud Run job
gcloud run jobs create bsp-loop-runner \
  --project=nouvia-os \
  --region=us-central1 \
  --image=gcr.io/nouvia-os/bsp-loop-runner:latest \
  --service-account=bsp-runner@nouvia-os.iam.gserviceaccount.com \
  --memory=512Mi \
  --cpu=1 \
  --max-retries=1 \
  --task-timeout=300s \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest" \
  --set-env-vars="BSP_MCP_URL=https://nouvia-strategist-mcp-899147386050.us-central1.run.app/sse,DIGEST_DELIVERY=wrapper,BEN_EMAIL=benmelchionno@nouvia.ai"

# Schedule: Weekly scan — every Monday 6 AM ET
gcloud scheduler jobs create http bsp-weekly-scan \
  --project=nouvia-os \
  --location=us-central1 \
  --schedule="0 6 * * 1" \
  --time-zone="America/New_York" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/nouvia-os/jobs/bsp-loop-runner:run" \
  --http-method=POST \
  --oauth-service-account-email=bsp-runner@nouvia-os.iam.gserviceaccount.com \
  --headers="Content-Type=application/json" \
  --body='{"overrides":{"containerOverrides":[{"env":[{"name":"LOOP_TYPE","value":"weekly"}]}]}}'

# Schedule: Monthly health — 1st of month 7 AM ET
gcloud scheduler jobs create http bsp-monthly-health \
  --project=nouvia-os \
  --location=us-central1 \
  --schedule="0 7 1 * *" \
  --time-zone="America/New_York" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/nouvia-os/jobs/bsp-loop-runner:run" \
  --http-method=POST \
  --oauth-service-account-email=bsp-runner@nouvia-os.iam.gserviceaccount.com \
  --headers="Content-Type=application/json" \
  --body='{"overrides":{"containerOverrides":[{"env":[{"name":"LOOP_TYPE","value":"monthly"}]}]}}'
```

## Step 5: Test Before Going Live

```bash
# Test Sentinel reporter (dry run — prints report, doesn't write)
cd sentinel-reporter
DRY_RUN=true BSP_PROJECT=nouvia-os npm start

# Test BSP weekly scan (dry run — prints digest, doesn't email)
cd bsp-runner-deploy
LOOP_TYPE=weekly DRY_RUN=true \
  ANTHROPIC_API_KEY=sk-ant-... \
  BSP_MCP_URL=https://nouvia-strategist-mcp-899147386050.us-central1.run.app/sse \
  npm start

# Test BSP monthly health (dry run)
LOOP_TYPE=monthly DRY_RUN=true \
  ANTHROPIC_API_KEY=sk-ant-... \
  BSP_MCP_URL=https://nouvia-strategist-mcp-899147386050.us-central1.run.app/sse \
  npm start

# Manual trigger in Cloud Run (not dry run — full execution)
gcloud run jobs execute sentinel-reporter --project=nouvia-os --region=us-central1
gcloud run jobs execute bsp-loop-runner --project=nouvia-os --region=us-central1 \
  --update-env-vars="LOOP_TYPE=weekly"
```

## Monitoring

```bash
# View recent executions
gcloud run jobs executions list --job=bsp-loop-runner --project=nouvia-os --region=us-central1
gcloud run jobs executions list --job=sentinel-reporter --project=nouvia-os --region=us-central1

# Tail logs
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="bsp-loop-runner"' \
  --project=nouvia-os --limit=50 --format=json

gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="sentinel-reporter"' \
  --project=nouvia-os --limit=50 --format=json
```

## Logging Requirements for IVC Platform

For the Sentinel reporter to collect meaningful data, the IVC platform's Cloud Run
service must emit structured log entries. Two types of log entries are needed:

### Action Logs (for usage + adoption)

Every user-facing action should log:
```json
{
  "action_type": "annotation_run",
  "user_id": "user-abc123",
  "session_id": "sess-xyz789",
  "model_call": false
}
```

### Model Call Logs (for AI metrics)

Every AI model invocation should log:
```json
{
  "model_call": true,
  "model_id": "claude-sonnet-4-20250514",
  "input_tokens": 2400,
  "output_tokens": 800,
  "user_id": "user-abc123"
}
```

If the IVC platform doesn't currently emit these structured logs, that's a
prerequisite build task before Sentinel reporting will produce meaningful data.
The reporter handles missing data gracefully (returns zeroed metrics with
`_note` fields), but the monthly BSP health loop will flag delivery health
as "partially blind."

## Cost Estimate

| Component | Frequency | Cost/Run | Annual |
|-----------|-----------|----------|--------|
| Sentinel Reporter | Monthly | ~$0.01 | ~$0.12 |
| BSP Weekly Scan | Weekly | ~$0.25-0.55 | ~$15-30 |
| BSP Monthly Health | Monthly | ~$0.55-2.05 | ~$7-25 |
| Cloud Scheduler | 3 triggers | Free tier | $0 |
| **Total** | | | **~$22-55/year** |

## Updating Prompts

The system prompts live in `bsp-runner-deploy/prompts/`. To update:

1. Edit the prompt file
2. Rebuild: `gcloud builds submit --tag gcr.io/nouvia-os/bsp-loop-runner:latest`
3. Update the job: `gcloud run jobs update bsp-loop-runner --image=gcr.io/nouvia-os/bsp-loop-runner:latest`

No need to recreate scheduler triggers — they reference the job, not the image.

## Adding a New Client Platform to Sentinel

Edit `sentinel-reporter/src/index.js` and add an entry to the `PLATFORMS` array:

```javascript
{
  client: 'NewClient',
  clientSlug: 'newclient',
  platform: 'Platform Name',
  platformSlug: 'platform-name',
  gcpProject: 'newclient-gcp-project-id',  // The CLIENT's GCP project, not nouvia-os
  cloudRunService: 'newclient-service-name',
  firestoreCollection: 'main_activity_collection',
  licensedUsers: 10,
  accuracyMetricType: 'relevant_accuracy_metric',
  accuracyBaseline: 0.80,
  actionTypes: ['action_1', 'action_2', 'action_3'],
}
```

Rebuild and redeploy. The monthly BSP loop automatically picks up new
sentinel_reports documents — no changes needed on that side.
