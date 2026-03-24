# BSP Data Flow Architecture

**Last updated:** March 24, 2026
**Decision reference:** Tracker Decision #44 — Client environment boundary

---

## Core Principle

All Nouvia infrastructure runs on `nouvia-os`. Client environments receive zero Nouvia deployments. Sentinel accesses client data via read-only cross-project IAM grants only.

---

## Two-Project Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  adk-ivc-rag  (IVC's GCP — CLIENT ENVIRONMENT)                      │
│                                                                      │
│  ┌─────────────────────────┐    ┌─────────────────────────┐         │
│  │ floorplan-annotator-api │    │ ivc-ai-cockpit-ui       │         │
│  │ (Cloud Run - FastAPI)   │    │ (Cloud Run - Next.js)   │         │
│  │                         │    │                         │         │
│  │ POST /process           │◄───│ User uploads floorplan  │         │
│  │ POST /update_row        │    │ User edits annotations  │         │
│  │ POST /finalize          │    │ User finalizes session  │         │
│  │ GET  /mappings/lookup   │    │ User searches library   │         │
│  └────────┬────────────────┘    └─────────────────────────┘         │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────┐    ┌─────────────────────────┐         │
│  │ Cloud Logging            │    │ Firestore               │         │
│  │                          │    │ (floorplan_jobs,        │         │
│  │ Structured action logs   │    │  accuracy_tracking,     │         │
│  │ Model call logs          │    │  user_feedback)         │         │
│  │ Request/response logs    │    │                         │         │
│  └──────────┬───────────────┘    └──────────┬──────────────┘         │
│             │                               │                        │
│             │  READ-ONLY IAM                │  READ-ONLY IAM         │
│             │  roles/logging.viewer         │  roles/datastore.viewer │
└─────────────┼───────────────────────────────┼────────────────────────┘
              │                               │
              ▼                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  nouvia-os  (NOUVIA'S GCP — ALL NOUVIA INFRASTRUCTURE)               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  Sentinel Reporter  (Cloud Run Job)                       │        │
│  │  Schedule: 28th of each month, 6 AM ET                    │        │
│  │                                                           │        │
│  │  1. Reads Cloud Logging from adk-ivc-rag                 │        │
│  │  2. Reads Firestore from adk-ivc-rag                     │        │
│  │  3. Computes health scores                                │        │
│  │  4. Writes report to sentinel_reports on nouvia-os        │        │
│  └──────────────────────────┬────────────────────────────────┘        │
│                             │                                         │
│                             ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  Firestore (nouvia-os)                                    │        │
│  │                                                           │        │
│  │  sentinel_reports ← Sentinel writes here                  │        │
│  │  canvas           ← BSP reads/flags                       │        │
│  │  trends           ← Weekly scan writes here               │        │
│  │  experiments      ← Monthly health proposes here          │        │
│  │  capability_gaps  ← Monthly health logs here              │        │
│  │  clients, goals, okrs, mrr_entries, etc.                  │        │
│  └──────────┬───────────────────────────────┬────────────────┘        │
│             │                               │                         │
│             ▼                               ▼                         │
│  ┌──────────────────────────┐  ┌───────────────────────────┐         │
│  │  BSP Monthly Health Loop  │  │  BSP Weekly Scan Loop     │         │
│  │  (Cloud Run Job)          │  │  (Cloud Run Job)          │         │
│  │  1st of month, 7 AM ET   │  │  Every Monday, 6 AM ET    │         │
│  │                           │  │                           │         │
│  │  Reads:                   │  │  Reads:                   │         │
│  │  - sentinel_reports       │  │  - canvas (scan targets)  │         │
│  │  - canvas, cockpit       │  │                           │         │
│  │  - coworkers, experiments│  │  Runs:                    │         │
│  │  - MRR history           │  │  - Web search (8-12       │         │
│  │                           │  │    queries across 4       │         │
│  │  Writes:                  │  │    dimensions)            │         │
│  │  - experiments (Hypothesis│  │                           │         │
│  │    status — Ben validates)│  │  Writes:                  │         │
│  │  - capability_gaps        │  │  - trends to Firestore    │         │
│  │                           │  │                           │         │
│  │  Outputs:                 │  │  Outputs:                 │         │
│  │  - Monthly OS Health      │  │  - Weekly Market Scan     │         │
│  │    digest email           │  │    digest email           │         │
│  └──────────┬────────────────┘  └──────────┬────────────────┘         │
│             │                               │                         │
│             ▼                               ▼                         │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  BSP MCP Server  (Cloud Run Service — always on)          │        │
│  │  nouvia-strategist-mcp-*.us-central1.run.app              │        │
│  │                                                           │        │
│  │  Provides tool access to Firestore for both loops:        │        │
│  │  read_canvas, get_cockpit_summary, list_coworkers,        │        │
│  │  log_trend, add_experiment, log_capability_gap, etc.      │        │
│  └───────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  Anthropic API  (external)                                │        │
│  │  - BSP runner calls claude-sonnet with system prompts     │        │
│  │  - API key stored in Secret Manager on nouvia-os          │        │
│  └───────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  Cloud Scheduler  (nouvia-os)                             │        │
│  │                                                           │        │
│  │  sentinel-reporter-monthly  → 28th, 6 AM ET              │        │
│  │  bsp-weekly-scan            → Monday, 6 AM ET            │        │
│  │  bsp-monthly-health         → 1st, 7 AM ET              │        │
│  └───────────────────────────────────────────────────────────┘        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Ben's Inbox (benmelchionno@nouvia.ai)                               │
│                                                                      │
│  Every Monday:  Weekly Market Scan digest                            │
│  Every 1st:     Monthly OS Health digest                             │
│                                                                      │
│  Ben reviews digests and governs:                                    │
│  - Validates/rejects proposed experiments                            │
│  - Acts on canvas flags                                              │
│  - Triggers Forge tasks based on capability gaps                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## IAM Grants Summary

### On nouvia-os (Nouvia's project)

| Role | Purpose |
|------|---------|
| `roles/logging.viewer` | Read Cloud Logging |
| `roles/datastore.user` | Read/write Firestore (BSP data) |
| `roles/run.invoker` | Cloud Scheduler triggers Cloud Run jobs |
| `roles/secretmanager.secretAccessor` | Read Anthropic API key |

### On adk-ivc-rag (IVC's project) — READ-ONLY

| Role | Purpose |
|------|---------|
| `roles/logging.viewer` | Sentinel reads Cloud Logging (usage, performance, model calls) |
| `roles/datastore.viewer` | Sentinel reads Firestore (accuracy, feedback, job data) |

Service account for all grants: `bsp-runner@nouvia-os.iam.gserviceaccount.com`

---

## Scheduling Sequence

The timing is deliberate:

```
28th of month, 6 AM ET  →  Sentinel Reporter runs
                             Collects previous month's data from adk-ivc-rag
                             Writes sentinel_reports to nouvia-os Firestore
                             [3-day buffer]

1st of month, 7 AM ET   →  BSP Monthly Health Loop runs
                             Reads sentinel_reports (now populated)
                             Reads canvas, cockpit, coworkers, experiments
                             Assesses health, proposes experiments
                             Emails Monthly OS Health digest to Ben

Every Monday, 6 AM ET   →  BSP Weekly Scan Loop runs
                             Reads canvas (for dynamic scan targets)
                             Runs web searches (funding, competitors, sectors, tech)
                             Writes trends to Firestore
                             Emails Weekly Market Scan digest to Ben
```

---

## Scaling to New Clients

Adding a new client follows this pattern:

1. **IAM grant** — Read-only `logging.viewer` + `datastore.viewer` on the client's GCP project
2. **PLATFORMS config** — Add entry to `sentinel-reporter/src/index.js` with:
   - Client's GCP project ID
   - Client's Cloud Run service name
   - Client's Firestore collection names
   - Licensed user count and action types
3. **Structured logging** — Add `log_action()` and `log_model_call()` to the client's platform code (deployed through their CI/CD)
4. **Rebuild Sentinel** — Rebuild and redeploy on `nouvia-os`

The BSP loops automatically pick up new `sentinel_reports` documents. No changes needed to the loop runner or its prompts.

---

## What Touches Each Project

### nouvia-os — Nouvia deploys and owns

- Sentinel Reporter (Cloud Run Job)
- BSP Loop Runner (Cloud Run Job)
- BSP MCP Server (Cloud Run Service)
- Firestore (all BSP collections)
- Cloud Scheduler (3 triggers)
- Secret Manager (Anthropic API key)
- Container Registry (container images)

### adk-ivc-rag — Nouvia NEVER deploys here

Nouvia only has:
- 2 read-only IAM grants on the existing project
- Structured logging code in the IVC application (deployed via IVC's CI/CD, same as any feature)

No Nouvia Cloud Run jobs, no Nouvia Firestore collections, no Nouvia secrets, no Nouvia schedulers.
