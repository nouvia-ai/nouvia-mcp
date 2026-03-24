/**
 * Usage Collector
 *
 * Pulls platform usage data from Cloud Logging for the reporting period.
 * Counts sessions, actions, active users, peak concurrency, and zero-usage days.
 *
 * Expects structured log entries with fields:
 *   - user_id: string
 *   - action_type: string (one of the platform's defined action types)
 *   - session_id: string
 *   - timestamp: ISO string
 *
 * If Cloud Logging data is unavailable or sparse, returns partial data
 * with flags indicating which metrics are estimated.
 */

import { Logging } from '@google-cloud/logging';
import { log } from '../utils.js';

/**
 * Collect usage metrics for a platform in a given period.
 * @param {Object} platform - Platform config from registry
 * @param {string} period - YYYY-MM format
 * @returns {Object} Usage metrics matching sentinel_reports schema
 */
export async function collectUsage(platform, period) {
  const logging = new Logging({ projectId: platform.gcpProject });

  const { startDate, endDate } = periodToDates(period);

  // Query Cloud Logging for platform activity
  const filter = [
    `resource.type="cloud_run_revision"`,
    `resource.labels.service_name="${platform.cloudRunService}"`,
    `timestamp >= "${startDate.toISOString()}"`,
    `timestamp < "${endDate.toISOString()}"`,
    `jsonPayload.action_type!=""`,
  ].join(' AND ');

  log('info', `Querying Cloud Logging for usage data...`);

  let entries = [];
  try {
    const [logEntries] = await logging.getEntries({
      filter,
      pageSize: 10000,
      orderBy: 'timestamp asc',
    });
    entries = logEntries;
    log('info', `Retrieved ${entries.length} log entries.`);
  } catch (error) {
    log('warn', `Cloud Logging query failed: ${error.message}. Returning empty usage.`);
    return buildEmptyUsage(platform);
  }

  if (entries.length === 0) {
    log('warn', `No log entries found for ${platform.cloudRunService} in ${period}.`);
    return buildEmptyUsage(platform);
  }

  // Parse entries
  const parsed = entries.map(entry => {
    const payload = entry.data || entry.metadata?.jsonPayload || {};
    return {
      userId: payload.user_id || 'unknown',
      actionType: payload.action_type || 'other',
      sessionId: payload.session_id || 'unknown',
      timestamp: new Date(entry.metadata?.timestamp || entry.timestamp),
    };
  });

  // Compute metrics
  const uniqueUsers = new Set(parsed.map(e => e.userId));
  const uniqueSessions = new Set(parsed.map(e => e.sessionId));

  // Actions by type
  const actionsByType = {};
  for (const type of platform.actionTypes) {
    actionsByType[type] = 0;
  }
  actionsByType.other = 0;

  for (const entry of parsed) {
    if (actionsByType.hasOwnProperty(entry.actionType)) {
      actionsByType[entry.actionType]++;
    } else {
      actionsByType.other++;
    }
  }

  // Session durations (approximate from first/last action per session)
  const sessionBounds = {};
  for (const entry of parsed) {
    if (!sessionBounds[entry.sessionId]) {
      sessionBounds[entry.sessionId] = { first: entry.timestamp, last: entry.timestamp };
    } else {
      if (entry.timestamp < sessionBounds[entry.sessionId].first) {
        sessionBounds[entry.sessionId].first = entry.timestamp;
      }
      if (entry.timestamp > sessionBounds[entry.sessionId].last) {
        sessionBounds[entry.sessionId].last = entry.timestamp;
      }
    }
  }

  const sessionDurations = Object.values(sessionBounds).map(
    b => (b.last - b.first) / 60000 // minutes
  );
  const avgSessionDuration = sessionDurations.length > 0
    ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
    : 0;

  // Peak concurrent users (hourly buckets)
  const hourlyUsers = {};
  for (const entry of parsed) {
    const hourKey = entry.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
    if (!hourlyUsers[hourKey]) hourlyUsers[hourKey] = new Set();
    hourlyUsers[hourKey].add(entry.userId);
  }
  const peakConcurrent = Math.max(...Object.values(hourlyUsers).map(s => s.size), 0);

  // Days with zero usage (business days only — Mon-Fri)
  const activeDays = new Set(parsed.map(e => e.timestamp.toISOString().substring(0, 10)));
  let businessDays = 0;
  let zeroUsageDays = 0;
  const cursor = new Date(startDate);
  while (cursor < endDate) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      businessDays++;
      if (!activeDays.has(cursor.toISOString().substring(0, 10))) {
        zeroUsageDays++;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    active_users: uniqueUsers.size,
    total_sessions: uniqueSessions.size,
    total_actions: parsed.length,
    actions_by_type: actionsByType,
    avg_session_duration_minutes: Math.round(avgSessionDuration * 10) / 10,
    peak_concurrent_users: peakConcurrent,
    days_with_zero_usage: zeroUsageDays,
  };
}

function buildEmptyUsage(platform) {
  const actionsByType = {};
  for (const type of platform.actionTypes) {
    actionsByType[type] = 0;
  }
  actionsByType.other = 0;

  return {
    active_users: 0,
    total_sessions: 0,
    total_actions: 0,
    actions_by_type: actionsByType,
    avg_session_duration_minutes: 0,
    peak_concurrent_users: 0,
    days_with_zero_usage: 0,
    _note: 'No usage data available for this period',
  };
}

function periodToDates(period) {
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1); // First day of next month
  return { startDate, endDate };
}
