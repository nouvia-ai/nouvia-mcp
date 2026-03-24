/**
 * Health Score Computation
 *
 * Computes a composite health score (0-100) from five weighted dimensions.
 * Matches the sentinel_reports schema health_score_breakdown.
 *
 * Dimensions and weights:
 *   - Usage (25%): active users, sessions, zero-usage days
 *   - Performance (25%): response time, error rate, uptime
 *   - Adoption (20%): adoption rate, churn, power users
 *   - Accuracy (15%): primary accuracy metric, trend
 *   - Cost efficiency (15%): cost per action trend
 *
 * Health status thresholds:
 *   - "healthy": 70+
 *   - "watch": 50-69
 *   - "critical": <50
 */

/**
 * Compute the composite health score.
 * @param {Object} data - { usage, performance, aiMetrics, adoption }
 * @param {Object} platform - Platform config
 * @returns {{ healthScore: number, breakdown: Object, status: string }}
 */
export function computeHealthScore(data, platform) {
  const { usage, performance, aiMetrics, adoption } = data;

  // --- Usage Score (25%) ---
  let usageScore = 50; // baseline
  if (platform.licensedUsers > 0 && usage.active_users > 0) {
    const usageRate = usage.active_users / platform.licensedUsers;
    if (usageRate > 0.7) usageScore = 90;
    else if (usageRate > 0.5) usageScore = 70;
    else if (usageRate > 0.3) usageScore = 50;
    else usageScore = 30;

    // Penalize high zero-usage days
    if (usage.days_with_zero_usage > 10) usageScore -= 20;
    else if (usage.days_with_zero_usage > 5) usageScore -= 10;
  } else if (usage._note) {
    // No data available
    usageScore = 0;
  }

  // --- Performance Score (25%) ---
  let performanceScore = 50;
  if (performance.uptime_percent > 0) {
    // Uptime component
    if (performance.uptime_percent >= 99.5) performanceScore = 95;
    else if (performance.uptime_percent >= 99) performanceScore = 85;
    else if (performance.uptime_percent >= 95) performanceScore = 65;
    else performanceScore = 40;

    // Error rate adjustment
    if (performance.error_rate_percent > 5) performanceScore -= 25;
    else if (performance.error_rate_percent > 3) performanceScore -= 15;
    else if (performance.error_rate_percent > 1) performanceScore -= 5;

    // Response time adjustment
    if (performance.response_time_p95_ms > 10000) performanceScore -= 15;
    else if (performance.response_time_p95_ms > 5000) performanceScore -= 5;
  } else if (performance._note) {
    performanceScore = 0;
  }

  // --- Adoption Score (20%) ---
  let adoptionScore = 50;
  if (adoption.licensed_users > 0) {
    if (adoption.adoption_rate_percent > 70) adoptionScore = 90;
    else if (adoption.adoption_rate_percent > 50) adoptionScore = 70;
    else if (adoption.adoption_rate_percent > 30) adoptionScore = 45;
    else adoptionScore = 25;

    // Churn penalty
    if (adoption.churned_users_this_period > 0) {
      adoptionScore -= adoption.churned_users_this_period * 10;
    }

    // Power user bonus
    if (adoption.power_users > 0) {
      adoptionScore += Math.min(adoption.power_users * 3, 10);
    }
  }

  // --- Accuracy Score (15%) ---
  let accuracyScore = 50;
  if (aiMetrics.accuracy_metric !== null) {
    const acc = aiMetrics.accuracy_metric;
    const baseline = platform.accuracyBaseline || 0.8;

    if (acc >= baseline + 0.05) accuracyScore = 95;
    else if (acc >= baseline) accuracyScore = 80;
    else if (acc >= baseline - 0.05) accuracyScore = 60;
    else if (acc >= baseline - 0.10) accuracyScore = 40;
    else accuracyScore = 20;

    // Trend adjustment
    if (aiMetrics.accuracy_trend === 'improving') accuracyScore += 5;
    else if (aiMetrics.accuracy_trend === 'declining') accuracyScore -= 10;
  } else {
    // No accuracy data
    accuracyScore = 0;
  }

  // --- Cost Efficiency Score (15%) ---
  // Without historical comparison, use absolute cost per action as proxy
  let costScore = 70; // neutral default
  if (aiMetrics.model_calls > 0 && aiMetrics.total_cost_usd > 0) {
    const costPerCall = aiMetrics.total_cost_usd / aiMetrics.model_calls;
    // Rough benchmarks: <$0.05 is great, $0.05-0.15 is fine, >$0.15 is expensive
    if (costPerCall < 0.05) costScore = 90;
    else if (costPerCall < 0.10) costScore = 75;
    else if (costPerCall < 0.20) costScore = 60;
    else costScore = 40;
  }

  // Clamp all scores to 0-100
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
  const scores = {
    usage_score: clamp(usageScore),
    performance_score: clamp(performanceScore),
    adoption_score: clamp(adoptionScore),
    accuracy_score: clamp(accuracyScore),
    cost_efficiency_score: clamp(costScore),
  };

  // Weighted composite
  const healthScore = clamp(
    scores.usage_score * 0.25 +
    scores.performance_score * 0.25 +
    scores.adoption_score * 0.20 +
    scores.accuracy_score * 0.15 +
    scores.cost_efficiency_score * 0.15
  );

  // Status
  let status;
  if (healthScore >= 70) status = 'healthy';
  else if (healthScore >= 50) status = 'watch';
  else status = 'critical';

  return {
    healthScore,
    breakdown: scores,
    status,
  };
}
