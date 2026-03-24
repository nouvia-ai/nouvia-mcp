/**
 * Sentinel Reporter — Main Entry Point
 *
 * Runs on the 1st of each month (before the BSP monthly loop).
 * Collects usage data from Cloud Logging, Firestore platform collections,
 * and AI API usage, then writes a structured report to the
 * BSP Firestore (sentinel_reports collection on nouvia-os).
 *
 * IMPORTANT: Client platforms may run on different GCP projects than the BSP.
 * - IVC platform runs on: adk-ivc-rag (Cloud Run, Cloud Logging, platform Firestore)
 * - BSP tracker runs on: nouvia-os (sentinel_reports, canvas, experiments)
 * Each platform entry specifies its own gcpProject for log/data collection.
 *
 * Environment variables:
 *   BSP_PROJECT      - GCP project for BSP Firestore (default: nouvia-os)
 *   REPORT_PERIOD    - Override period (YYYY-MM). Default: previous month.
 *   DRY_RUN          - "true" to print report without writing to Firestore
 */

import { Firestore } from '@google-cloud/firestore';
import { collectUsage } from './collectors/usage.js';
import { collectPerformance } from './collectors/performance.js';
import { collectAiMetrics } from './collectors/ai-metrics.js';
import { collectAdoption } from './collectors/adoption.js';
import { detectAnomalies } from './collectors/anomalies.js';
import { computeHealthScore } from './compute.js';
import { log } from './utils.js';

// BSP project — where sentinel_reports are written
const BSP_PROJECT = process.env.BSP_PROJECT || 'nouvia-os';

// Platform registry — add new platforms here as Nouvia takes on clients
// NOTE: gcpProject is the project where the platform RUNS (logs + data),
// which may differ from BSP_PROJECT where reports are WRITTEN.
const PLATFORMS = [
  {
    client: 'IVC',
    clientSlug: 'ivc',
    platform: 'Floorplan Takeoff Platform',
    platformSlug: 'floorplan-takeoff',
    gcpProject: 'adk-ivc-rag',                   // IVC runs on this GCP project
    cloudRunService: 'floorplan-annotator-api',   // Cloud Run service name on adk-ivc-rag
    firestoreCollection: 'floorplan_jobs',        // Main activity collection on adk-ivc-rag
    licensedUsers: 11,
    accuracyMetricType: 'annotation_accuracy',
    accuracyBaseline: 0.84,
    actionTypes: [
      'process_floorplan',   // POST /process — floorplan upload + OCR
      'update_row',          // POST /update_row — add/edit/delete annotation
      'finalize',            // POST /finalize — finalize session
      'mapping_lookup',      // GET /mappings/lookup — mapping library query
      'export',              // client-side CSV/PNG download (logged from UI)
      'admin_action',        // POST /mappings/upsert, /import_csv, /seed_baseline
    ],
  },
];

async function main() {
  const startTime = Date.now();

  // Determine reporting period (default: previous month)
  const period = process.env.REPORT_PERIOD || getPreviousMonth();
  log('info', `Sentinel Reporter starting — period: ${period}`);

  const db = new Firestore({ projectId: BSP_PROJECT });

  for (const platform of PLATFORMS) {
    log('info', `Collecting data for ${platform.client} / ${platform.platform}...`);

    try {
      // Collect data from all sources
      const [usage, performance, aiMetrics, adoption] = await Promise.all([
        collectUsage(platform, period),
        collectPerformance(platform, period),
        collectAiMetrics(platform, period),
        collectAdoption(platform, period, db),
      ]);

      // Detect anomalies across all collected data
      const anomalies = detectAnomalies({ usage, performance, aiMetrics, adoption }, platform);

      // Compute composite health score
      const { healthScore, breakdown, status } = computeHealthScore({
        usage, performance, aiMetrics, adoption,
      }, platform);

      // Build the report document
      const report = {
        client: platform.client,
        client_slug: platform.clientSlug,
        platform: platform.platform,
        platform_slug: platform.platformSlug,
        period,
        period_type: 'monthly',
        generated_at: new Date().toISOString(),
        generated_by: 'sentinel',
        usage,
        performance,
        ai_metrics: aiMetrics,
        adoption,
        anomalies,
        health_score: healthScore,
        health_score_breakdown: breakdown,
        health_status: status,
      };

      // Write or print
      const docId = `${platform.clientSlug}_${platform.platformSlug}_${period}`;

      if (process.env.DRY_RUN === 'true') {
        log('info', `DRY_RUN — would write to sentinel_reports/${docId}:`);
        console.log(JSON.stringify(report, null, 2));
      } else {
        await db.collection('sentinel_reports').doc(docId).set(report);
        log('info', `Report written: sentinel_reports/${docId} — health: ${status} (${healthScore})`);
      }

    } catch (error) {
      log('error', `Failed to generate report for ${platform.client}: ${error.message}`);
      log('error', error.stack);
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  log('info', `Sentinel Reporter complete — ${elapsed}s`);
}

function getPreviousMonth() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prev.getFullYear();
  const month = String(prev.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

main();
