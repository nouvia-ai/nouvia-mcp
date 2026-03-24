/**
 * Performance Collector
 *
 * Pulls performance metrics from Cloud Logging:
 * response times, error rates, uptime, and incidents.
 */

import { Logging } from '@google-cloud/logging';
import { log } from '../utils.js';

export async function collectPerformance(platform, period) {
  const logging = new Logging({ projectId: platform.gcpProject });
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // Query request logs for the Cloud Run service
  const filter = [
    `resource.type="cloud_run_revision"`,
    `resource.labels.service_name="${platform.cloudRunService}"`,
    `timestamp >= "${startDate.toISOString()}"`,
    `timestamp < "${endDate.toISOString()}"`,
    `httpRequest.requestMethod!=""`,
  ].join(' AND ');

  log('info', 'Querying Cloud Logging for performance data...');

  let entries = [];
  try {
    const [logEntries] = await logging.getEntries({
      filter,
      pageSize: 10000,
      orderBy: 'timestamp asc',
    });
    entries = logEntries;
  } catch (error) {
    log('warn', `Performance data query failed: ${error.message}`);
    return buildEmptyPerformance();
  }

  if (entries.length === 0) {
    return buildEmptyPerformance();
  }

  // Extract response times and status codes
  const responseTimes = [];
  let totalRequests = 0;
  let errorCount = 0;
  const errorsByType = { timeout: 0, model_error: 0, data_error: 0, auth_error: 0 };

  for (const entry of entries) {
    const http = entry.data?.httpRequest || entry.metadata?.httpRequest || {};
    const latencyMs = parseLatency(http.latency);

    if (latencyMs !== null) {
      responseTimes.push(latencyMs);
    }

    totalRequests++;
    const status = http.status || 0;

    if (status >= 400) {
      errorCount++;
      if (status === 408 || status === 504) errorsByType.timeout++;
      else if (status === 401 || status === 403) errorsByType.auth_error++;
      else if (status >= 500) errorsByType.model_error++;
      else errorsByType.data_error++;
    }
  }

  // Compute percentiles
  responseTimes.sort((a, b) => a - b);
  const p50 = percentile(responseTimes, 0.5);
  const p95 = percentile(responseTimes, 0.95);

  // Error rate
  const errorRate = totalRequests > 0
    ? Math.round((errorCount / totalRequests) * 10000) / 100
    : 0;

  // Uptime — approximate from days with successful requests
  const activeDays = new Set();
  const totalDays = new Set();
  const cursor = new Date(startDate);
  while (cursor < endDate) {
    totalDays.add(cursor.toISOString().substring(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const entry of entries) {
    const ts = new Date(entry.metadata?.timestamp || entry.timestamp);
    const status = entry.data?.httpRequest?.status || entry.metadata?.httpRequest?.status || 0;
    if (status < 500) {
      activeDays.add(ts.toISOString().substring(0, 10));
    }
  }

  const uptimePercent = totalDays.size > 0
    ? Math.round((activeDays.size / totalDays.size) * 1000) / 10
    : 0;

  return {
    response_time_p50_ms: Math.round(p50),
    response_time_p95_ms: Math.round(p95),
    error_rate_percent: errorRate,
    errors_by_type: errorsByType,
    uptime_percent: uptimePercent,
    incidents: [], // Populated from incident tracking (future: pull from Sentinel triage log)
  };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)];
}

function parseLatency(latency) {
  if (!latency) return null;
  if (typeof latency === 'number') return latency;
  // Cloud Logging formats latency as "0.123s"
  const match = String(latency).match(/([\d.]+)s/);
  return match ? parseFloat(match[1]) * 1000 : null;
}

function buildEmptyPerformance() {
  return {
    response_time_p50_ms: 0,
    response_time_p95_ms: 0,
    error_rate_percent: 0,
    errors_by_type: { timeout: 0, model_error: 0, data_error: 0, auth_error: 0 },
    uptime_percent: 0,
    incidents: [],
    _note: 'No performance data available for this period',
  };
}
