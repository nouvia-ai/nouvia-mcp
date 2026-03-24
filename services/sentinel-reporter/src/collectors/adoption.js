/**
 * Adoption Collector
 *
 * Computes user adoption metrics: adoption rate, churn, power users,
 * and per-feature usage rates.
 *
 * Sources:
 *   - Firestore: platform user activity collection
 *   - Cloud Logging: per-user action counts
 */

import { Logging } from '@google-cloud/logging';
import { log } from '../utils.js';

const POWER_USER_THRESHOLD = 50; // actions per period

export async function collectAdoption(platform, period, db) {
  const logging = new Logging({ projectId: platform.gcpProject });
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const prevMonth = new Date(year, month - 2, 1);

  // Get current period activity per user
  const currentUsers = await getUserActivity(logging, platform, startDate, endDate);
  // Get previous period activity for churn detection
  const prevUsers = await getUserActivity(logging, platform, prevMonth, startDate);

  const activeUserIds = new Set(Object.keys(currentUsers));
  const prevActiveUserIds = new Set(Object.keys(prevUsers));

  // New users: active this period but not last period
  const newUsers = [...activeUserIds].filter(id => !prevActiveUserIds.has(id));

  // Churned users: active last period but not this period
  const churnedUsers = [...prevActiveUserIds].filter(id => !activeUserIds.has(id));

  // Power users: exceed threshold
  const powerUsers = [...activeUserIds].filter(
    id => (currentUsers[id]?.total || 0) >= POWER_USER_THRESHOLD
  );

  // Feature usage rates (what fraction of active users used each feature)
  const featureUsage = {};
  for (const actionType of platform.actionTypes) {
    const usersOfFeature = [...activeUserIds].filter(
      id => (currentUsers[id]?.byType?.[actionType] || 0) > 0
    );
    featureUsage[actionType] = activeUserIds.size > 0
      ? Math.round((usersOfFeature.length / activeUserIds.size) * 100) / 100
      : 0;
  }

  const adoptionRate = platform.licensedUsers > 0
    ? Math.round((activeUserIds.size / platform.licensedUsers) * 1000) / 10
    : 0;

  return {
    licensed_users: platform.licensedUsers,
    active_users: activeUserIds.size,
    adoption_rate_percent: adoptionRate,
    new_users_this_period: newUsers.length,
    churned_users_this_period: churnedUsers.length,
    power_users: powerUsers.length,
    power_user_threshold: `${POWER_USER_THRESHOLD}+ actions in period`,
    feature_usage: featureUsage,
  };
}

/**
 * Get per-user action counts from Cloud Logging for a time range.
 * Returns { userId: { total, byType: { actionType: count } } }
 */
async function getUserActivity(logging, platform, startDate, endDate) {
  const filter = [
    `resource.type="cloud_run_revision"`,
    `resource.labels.service_name="${platform.cloudRunService}"`,
    `timestamp >= "${startDate.toISOString()}"`,
    `timestamp < "${endDate.toISOString()}"`,
    `jsonPayload.user_id!=""`,
    `jsonPayload.action_type!=""`,
  ].join(' AND ');

  const users = {};

  try {
    const [entries] = await logging.getEntries({ filter, pageSize: 10000 });

    for (const entry of entries) {
      const payload = entry.data || {};
      const userId = payload.user_id || 'unknown';
      const actionType = payload.action_type || 'other';

      if (!users[userId]) {
        users[userId] = { total: 0, byType: {} };
      }
      users[userId].total++;
      users[userId].byType[actionType] = (users[userId].byType[actionType] || 0) + 1;
    }
  } catch (error) {
    log('warn', `User activity query failed: ${error.message}`);
  }

  return users;
}
