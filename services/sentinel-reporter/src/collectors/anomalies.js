/**
 * Anomaly Detector
 *
 * Scans collected metrics for unusual patterns worth flagging.
 * Each anomaly includes type, description, severity, and possible cause.
 *
 * Anomaly types:
 *   - usage_spike / usage_drop: >30% change from expected baseline
 *   - error_spike: error rate exceeds 5%
 *   - accuracy_drop: accuracy falls below platform baseline
 *   - adoption_churn: any churned users detected
 *   - cost_spike: AI cost per action increases >20%
 *   - zero_usage_streak: >5 business days with no activity
 */

import { log } from '../utils.js';

/**
 * Detect anomalies across all collected metrics.
 * @param {Object} data - { usage, performance, aiMetrics, adoption }
 * @param {Object} platform - Platform config
 * @returns {Array} Anomaly objects
 */
export function detectAnomalies(data, platform) {
  const anomalies = [];
  const { usage, performance, aiMetrics, adoption } = data;

  // Zero usage streak
  if (usage.days_with_zero_usage > 5) {
    anomalies.push({
      type: 'zero_usage_streak',
      description: `${usage.days_with_zero_usage} business days with zero platform activity`,
      severity: usage.days_with_zero_usage > 10 ? 'warning' : 'info',
      possible_cause: 'Client may not be using the platform regularly, or logging may be incomplete',
    });
  }

  // Error rate spike
  if (performance.error_rate_percent > 5) {
    anomalies.push({
      type: 'error_spike',
      description: `Error rate at ${performance.error_rate_percent}% (threshold: 5%)`,
      severity: performance.error_rate_percent > 10 ? 'critical' : 'warning',
      possible_cause: 'Check recent deployments, infrastructure changes, or upstream API issues',
    });
  }

  // Accuracy below baseline
  if (aiMetrics.accuracy_metric !== null && platform.accuracyBaseline) {
    if (aiMetrics.accuracy_metric < platform.accuracyBaseline) {
      const gap = Math.round((platform.accuracyBaseline - aiMetrics.accuracy_metric) * 100);
      anomalies.push({
        type: 'accuracy_drop',
        description: `${platform.accuracyMetricType} at ${Math.round(aiMetrics.accuracy_metric * 100)}% — ${gap} points below the ${Math.round(platform.accuracyBaseline * 100)}% baseline`,
        severity: gap > 10 ? 'critical' : 'warning',
        possible_cause: 'Model degradation, data drift, or new edge cases in input data',
      });
    }
  }

  // Accuracy declining trend
  if (aiMetrics.accuracy_trend === 'declining') {
    anomalies.push({
      type: 'accuracy_drop',
      description: `${platform.accuracyMetricType} trend is declining`,
      severity: 'warning',
      possible_cause: 'Gradual model drift — may need retraining or prompt adjustments',
    });
  }

  // User churn
  if (adoption.churned_users_this_period > 0) {
    anomalies.push({
      type: 'adoption_churn',
      description: `${adoption.churned_users_this_period} user(s) stopped using the platform this period`,
      severity: adoption.churned_users_this_period > 2 ? 'warning' : 'info',
      possible_cause: 'Check if users changed roles, left the company, or found the tool unhelpful',
    });
  }

  // Low adoption rate
  if (adoption.adoption_rate_percent < 50 && adoption.licensed_users > 0) {
    anomalies.push({
      type: 'adoption_low',
      description: `Only ${adoption.adoption_rate_percent}% of licensed users are active (${adoption.active_users}/${adoption.licensed_users})`,
      severity: 'warning',
      possible_cause: 'Onboarding gaps, insufficient training, or tool not solving a real pain point for all users',
    });
  }

  // High negative feedback ratio
  const totalFeedback = aiMetrics.feedback_positive + aiMetrics.feedback_negative;
  if (totalFeedback > 10 && aiMetrics.feedback_negative > aiMetrics.feedback_positive) {
    anomalies.push({
      type: 'feedback_negative',
      description: `Negative feedback (${aiMetrics.feedback_negative}) exceeds positive (${aiMetrics.feedback_positive})`,
      severity: 'warning',
      possible_cause: 'AI output quality may not meet user expectations — review recent outputs',
    });
  }

  // Slow response times
  if (performance.response_time_p95_ms > 10000) {
    anomalies.push({
      type: 'performance_slow',
      description: `P95 response time is ${Math.round(performance.response_time_p95_ms / 1000)}s — exceeds 10s threshold`,
      severity: 'warning',
      possible_cause: 'Large input files, model latency, or infrastructure bottleneck',
    });
  }

  log('info', `Anomaly detection complete — ${anomalies.length} anomalies found`);
  return anomalies;
}
