# BSP Autonomous Loops — Deployment Guide

**What you're deploying:** Two Cloud Run jobs on GCP project `nouvia-os` (Nouvia's infrastructure).

1. **sentinel-reporter** — Reads IVC platform logs from `adk-ivc-rag` (IVC's GCP), writes health reports to Firestore on `nouvia-os`
2. **bsp-loop-runner** — Calls Claude via Anthropic API on a schedule, reads/writes BSP data on `nouvia-os`, emails digests to Ben

**Architecture boundary:** All Nouvia infrastructure deploys to `nouvia-os` only. The IVC client environment (`adk-ivc-rag`) receives zero Nouvia deployments. Sentinel accesses IVC data via read-only cross-project IAM grants. See `BSP-DATA-FLOW.md` for the full architecture diagram.

**Estimated time:** 45-60 minutes for first deployment.
**Estimated annual cost:** ~$22-55/year total.

---

## Before You Start

**You'll need:**
- `gcloud` CLI installed and authenticated
- Owner/Editor access to GCP project `nouvia-os`
- IAM admin access to GCP project `adk-ivc-rag` (to grant read-only log access)
- Your Anthropic API key (starts with `sk-ant-`)
- The deploy files from your Drive folder

**Authenticate and set project:**
```bash
gcloud auth login benmelchionno@nouvia.ai
gcloud config set project nouvia-os
gcloud config list
# Should show: project = nouvia-os, account = benmelchionno@nouvia.ai
```

---

## Phase 1: Service Account & Secrets (10 min)

These are shared by both jobs. Everything deploys to `nouvia-os`.

### Step 1.1 — Create the service account

```bash
gcloud iam service-accounts create bsp-runner \
  --display-name="BSP Loop Runner & Sentinel Reporter"
```

If it says "already exists", skip to Step 1.2.

### Step 1.2 — Grant permissions on nouvia-os

```bash
# Read Cloud Logging on nouvia-os
gcloud projects add-iam-policy-binding nouvia-os \
  --member="serviceAccount:bsp-runner@nouvia-os.iam.gserviceaccount.com" \
  --role="roles/logging.viewer"

# Read/write Firestore on nouvia-os (BSP data: sentinel_reports, canvas, trends, experiments)
gcloud projects add-iam-policy-binding nouvia-os \
  --member="serviceAccount:bsp-runner@nouvia-os.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Invoke Cloud Run on nouvia-os (scheduler needs this)
gcloud projects add-iam-policy-binding nouvia-os \
  --member="serviceAccount:bsp-runner@nouvia-os.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

# Read secrets on nouvia-os (BSP runner needs the Anthropic API key)
gcloud projects add-iam-policy-binding nouvia-os \
  --member="serviceAccount:bsp-runner@nouvia-os.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 1.3 — Grant read-only access to IVC client environment

Sentinel needs to read Cloud Logging and Firestore from `adk-ivc-rag` (IVC's GCP project). These are **read-only** grants — Nouvia never writes to or deploys into the client environment.

```bash
# Read IVC platform logs (Cloud Logging on adk-ivc-rag)
gcloud projects add-iam-policy-binding adk-ivc-rag \
  --member="serviceAccount:bsp-runner@nouvia-os.iam.gserviceaccount.com" \
  --role="roles/logging.viewer"

# Read IVC platform data (Firestore on adk-ivc-rag — for accuracy and usage metrics)
gcloud projects add-iam-policy-binding adk-ivc-rag \
  --member="serviceAccount:bsp-runner@nouvia-os.iam.gserviceaccount.com" \
  --role="roles/datastore.viewer"
```

### Step 1.4 — Store your Anthropic API key

```bash
echo -n "sk-ant-YOUR-KEY" | gcloud secrets create anthropic-api-key \
  --replication-policy="automatic" \
  --data-file=-
```

**If the secret already exists**, update it instead:
```bash
echo -n "sk-ant-YOUR-KEY" | gcloud secrets versions add anthropic-api-key \
  --data-file=-
```

### Step 1.5 — Enable required APIs on nouvia-os

```bash
gcloud services enable \
  run.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  logging.googleapis.com \
  firestore.googleapis.com
```

---

## Phase 2: Deploy Sentinel Reporter (15 min)

Sentinel deploys to `nouvia-os`. It reads from `adk-ivc-rag`, writes to `nouvia-os`.

### Step 2.1 — Navigate to the sentinel-reporter folder

```bash
cd ~/Downloads/BSP-CORRECTED-DEPLOY/sentinel-reporter
```

### Step 2.2 — Build and push the container

```bash
gcloud builds submit --tag gcr.io/nouvia-os/sentinel-reporter:latest
```

**Wait for "SUCCESS".**

### Step 2.3 — Create the Cloud Run job

```bash
gcloud run jobs create sentinel-reporter \
  --region=us-central1 \
  --image=gcr.io/nouvia-os/sentinel-reporter:latest \
  --service-account=bsp-runner@nouvia-os.iam.gserviceaccount.com \
  --memory=512Mi \
  --cpu=1 \
  --max-retries=1 \
  --task-timeout=300s \
  --set-env-vars="BSP_PROJECT=nouvia-os"
```

Note: `BSP_PROJECT=nouvia-os` tells Sentinel where to write reports. It reads from `adk-ivc-rag` (configured in the PLATFORMS registry in the code).

### Step 2.4 — Test it (dry run)

```bash
gcloud run jobs execute sentinel-reporter \
  --region=us-central1 \
  --update-env-vars="DRY_RUN=true"
```

Check output:
```bash
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="sentinel-reporter"' \
  --limit=20 --format="value(jsonPayload.message)"
```

**Expected:** Zeroed metrics — IVC doesn't have structured logging yet.

### Step 2.5 — Schedule it

```bash
gcloud scheduler jobs create http sentinel-reporter-monthly \
  --location=us-central1 \
  --schedule="0 6 28 * *" \
  --time-zone="America/New_York" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/nouvia-os/jobs/sentinel-reporter:run" \
  --http-method=POST \
  --oauth-service-account-email=bsp-runner@nouvia-os.iam.gserviceaccount.com
```

---

## Phase 3: Deploy BSP Loop Runner (15 min)

BSP Loop Runner deploys to `nouvia-os`. It never touches `adk-ivc-rag`.

### Step 3.1 — Navigate to the bsp-runner-deploy folder

```bash
cd ~/Downloads/BSP-CORRECTED-DEPLOY/bsp-runner-deploy
```

### Step 3.2 — Build and push

```bash
gcloud builds submit --tag gcr.io/nouvia-os/bsp-loop-runner:latest
```

### Step 3.3 — Create the Cloud Run job

```bash
gcloud run jobs create bsp-loop-runner \
  --region=us-central1 \
  --image=gcr.io/nouvia-os/bsp-loop-runner:latest \
  --service-account=bsp-runner@nouvia-os.iam.gserviceaccount.com \
  --memory=512Mi \
  --cpu=1 \
  --max-retries=1 \
  --task-timeout=300s \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest" \
  --set-env-vars="BSP_MCP_URL=https://nouvia-strategist-mcp-899147386050.us-central1.run.app/sse,DIGEST_DELIVERY=wrapper,BEN_EMAIL=benmelchionno@nouvia.ai"
```

### Step 3.4 — Test weekly scan (dry run)

```bash
gcloud run jobs execute bsp-loop-runner \
  --region=us-central1 \
  --update-env-vars="LOOP_TYPE=weekly,DRY_RUN=true"
```

Check logs:
```bash
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="bsp-loop-runner"' \
  --limit=30 --format="value(jsonPayload.message)"
```

### Step 3.5 — Test monthly health (dry run)

```bash
gcloud run jobs execute bsp-loop-runner \
  --region=us-central1 \
  --update-env-vars="LOOP_TYPE=monthly,DRY_RUN=true"
```

### Step 3.6 — First live weekly scan (sends email)

```bash
gcloud run jobs execute bsp-loop-runner \
  --region=us-central1 \
  --update-env-vars="LOOP_TYPE=weekly"
```

**Check your inbox.** If email delivery fails, switch to Gmail MCP:

```bash
gcloud run jobs update bsp-loop-runner \
  --region=us-central1 \
  --update-env-vars="DIGEST_DELIVERY=gmail_mcp,GMAIL_MCP_URL=https://gmail.mcp.claude.com/mcp"
```

### Step 3.7 — Schedule both loops

```bash
# Weekly market scan — every Monday 6 AM ET
gcloud scheduler jobs create http bsp-weekly-scan \
  --location=us-central1 \
  --schedule="0 6 * * 1" \
  --time-zone="America/New_York" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/nouvia-os/jobs/bsp-loop-runner:run" \
  --http-method=POST \
  --oauth-service-account-email=bsp-runner@nouvia-os.iam.gserviceaccount.com \
  --headers="Content-Type=application/json" \
  --message-body='{"overrides":{"containerOverrides":[{"env":[{"name":"LOOP_TYPE","value":"weekly"}]}]}}'

# Monthly OS health — 1st of each month 7 AM ET
gcloud scheduler jobs create http bsp-monthly-health \
  --location=us-central1 \
  --schedule="0 7 1 * *" \
  --time-zone="America/New_York" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/nouvia-os/jobs/bsp-loop-runner:run" \
  --http-method=POST \
  --oauth-service-account-email=bsp-runner@nouvia-os.iam.gserviceaccount.com \
  --headers="Content-Type=application/json" \
  --message-body='{"overrides":{"containerOverrides":[{"env":[{"name":"LOOP_TYPE","value":"monthly"}]}]}}'
```

---

## Phase 4: Add Structured Logging to IVC Platform (Forge task — separate)

This is a code change to the IVC application in the `ivc-ai-platform` repo, deployed through IVC's existing CI/CD to `adk-ivc-rag`. It is NOT a Nouvia infrastructure deployment.

See Phase 4 details in the DEPLOY.md inside bsp-runner-deploy/, or the previous conversation with the Strategist for the full Python code examples.

---

## Phase 5: Verify Everything Is Running

```bash
gcloud scheduler jobs list --location=us-central1 --project=nouvia-os
gcloud run jobs list --region=us-central1 --project=nouvia-os
```

---

## Deployment Summary

| # | What | GCP Project | Action |
|---|------|-------------|--------|
| 1.1-1.2 | Service account + IAM | nouvia-os | Create + grant |
| 1.3 | Cross-project read access | adk-ivc-rag | Grant read-only IAM |
| 1.4-1.5 | Secrets + APIs | nouvia-os | Create |
| 2.x | Sentinel Reporter | nouvia-os | Build, deploy, schedule |
| 3.x | BSP Loop Runner | nouvia-os | Build, deploy, schedule |
| 4.x | Structured logging (IVC code) | adk-ivc-rag (via CI/CD) | Blueprint → Forge |
