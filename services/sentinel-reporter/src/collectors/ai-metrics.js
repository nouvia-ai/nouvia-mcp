/**
 * AI Metrics Collector
 *
 * Pulls AI model usage data: call counts, token usage, costs, accuracy.
 * Sources:
 *   - Cloud Logging: model call logs with token counts
 *   - Firestore: accuracy metrics from platform's evaluation data
 *   - Firestore: user feedback data
 */

import { Logging } from '@google-cloud/logging';
import { Firestore } from '@google-cloud/firestore';
import { log } from '../utils.js';

export async function collectAiMetrics(platform, period) {
  const logging = new Logging({ projectId: platform.gcpProject });
  const db = new Firestore({ projectId: platform.gcpProject });

  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // Query model call logs
  const filter = [
    `resource.type="cloud_run_revision"`,
    `resource.labels.service_name="${platform.cloudRunService}"`,
    `timestamp >= "${startDate.toISOString()}"`,
    `timestamp < "${endDate.toISOString()}"`,
    `jsonPayload.model_call=true`,
  ].join(' AND ');

  let modelCalls = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let modelId = 'unknown';

  try {
    const [entries] = await logging.getEntries({ filter, pageSize: 10000 });

    for (const entry of entries) {
      const payload = entry.data || {};
      modelCalls++;
      totalInputTokens += payload.input_tokens || 0;
      totalOutputTokens += payload.output_tokens || 0;
      if (payload.model_id) modelId = payload.model_id;
    }
  } catch (error) {
    log('warn', `AI metrics log query failed: ${error.message}`);
  }

  // Compute cost estimate (Sonnet pricing as default)
  // Input: $3/MTok, Output: $15/MTok (adjust as pricing changes)
  const inputCost = (totalInputTokens / 1_000_000) * 3;
  const outputCost = (totalOutputTokens / 1_000_000) * 15;
  const totalCost = Math.round((inputCost + outputCost) * 100) / 100;

  const avgInput = modelCalls > 0 ? Math.round(totalInputTokens / modelCalls) : 0;
  const avgOutput = modelCalls > 0 ? Math.round(totalOutputTokens / modelCalls) : 0;

  // Pull accuracy from platform evaluation data
  let accuracyMetric = null;
  let accuracyTrend = 'stable';

  try {
    // Look for accuracy tracking in the platform's Firestore
    const accuracySnap = await db.collection('accuracy_tracking')
      .where('platform', '==', platform.platformSlug)
      .where('period', '==', period)
      .limit(1)
      .get();

    if (!accuracySnap.empty) {
      const doc = accuracySnap.docs[0].data();
      accuracyMetric = doc.accuracy || null;
      accuracyTrend = doc.trend || 'stable';
    } else {
      // Fallback: check the floorplan_jobs collection for recent accuracy
      const jobsSnap = await db.collection(platform.firestoreCollection)
        .where('completed_at', '>=', startDate)
        .where('completed_at', '<', endDate)
        .orderBy('completed_at', 'desc')
        .limit(100)
        .get();

      if (!jobsSnap.empty) {
        const accuracies = jobsSnap.docs
          .map(d => d.data().accuracy)
          .filter(a => typeof a === 'number');

        if (accuracies.length > 0) {
          accuracyMetric = Math.round((accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 100) / 100;
        }
      }
    }
  } catch (error) {
    log('warn', `Accuracy data query failed: ${error.message}`);
  }

  // Pull user feedback
  let feedbackPositive = 0;
  let feedbackNegative = 0;

  try {
    const feedbackSnap = await db.collection('user_feedback')
      .where('platform', '==', platform.platformSlug)
      .where('created_at', '>=', startDate)
      .where('created_at', '<', endDate)
      .get();

    for (const doc of feedbackSnap.docs) {
      const data = doc.data();
      if (data.sentiment === 'positive') feedbackPositive++;
      else if (data.sentiment === 'negative') feedbackNegative++;
    }
  } catch (error) {
    log('warn', `Feedback query failed: ${error.message}. Continuing without feedback data.`);
  }

  const totalFeedback = feedbackPositive + feedbackNegative;
  const totalActions = modelCalls; // approximate
  const feedbackRate = totalActions > 0
    ? Math.round((totalFeedback / totalActions) * 1000) / 10
    : 0;

  return {
    model_calls: modelCalls,
    model_id: modelId,
    avg_input_tokens: avgInput,
    avg_output_tokens: avgOutput,
    total_cost_usd: totalCost,
    accuracy_metric: accuracyMetric,
    accuracy_metric_type: platform.accuracyMetricType,
    accuracy_trend: accuracyTrend,
    feedback_positive: feedbackPositive,
    feedback_negative: feedbackNegative,
    feedback_rate_percent: feedbackRate,
  };
}
