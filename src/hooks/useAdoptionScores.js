/**
 * useAdoptionScores — NIP Phase 3
 * Manages adoption_scores and adoption_config from Firestore (user-scoped storage).
 * Seeds IVC baseline on first load.
 */
import { useState, useEffect, useCallback } from "react";
import { getData, setData } from "../storage";

const SCORES_KEY = "strategist:adoption_scores";
const CONFIG_KEY = "strategist:adoption_config";

// NAS component weights
export const NAS_WEIGHTS = {
  usage_frequency:   0.30,
  workflow_coverage:  0.25,
  user_penetration:   0.20,
  investment_rate:    0.15,
  velocity_trend:     0.10,
};

export const COMPONENT_LABELS = {
  usage_frequency:   "Usage Frequency",
  workflow_coverage:  "Workflow Coverage",
  user_penetration:   "User Penetration",
  investment_rate:    "Investment Rate",
  velocity_trend:     "Velocity Trend",
};

export const COMPONENT_DESCRIPTIONS = {
  usage_frequency:   "How often is the platform used relative to target?",
  workflow_coverage:  "What % of jobs run through platform vs. manually?",
  user_penetration:   "How many target users are active?",
  investment_rate:    "Are users contributing back to make the platform smarter?",
  velocity_trend:     "Is adoption accelerating or declining?",
};

export function getStatusFromScore(score) {
  if (score == null) return "pending";
  if (score >= 80) return "healthy";
  if (score >= 50) return "on_track";
  if (score >= 25) return "at_risk";
  return "critical";
}

export function getStatusColor(status) {
  return {
    healthy:  "green",
    on_track: "amber",
    at_risk:  "amber",
    critical: "red",
    pending:  "default",
  }[status] || "default";
}

export function getScoreColor(score) {
  if (score == null) return "var(--color-text-ghost)";
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 25) return "#f97316";
  return "#ef4444";
}

export function calculateNAS(components) {
  let total = 0;
  for (const [key, weight] of Object.entries(NAS_WEIGHTS)) {
    const comp = components[key];
    const score = comp?.score ?? 0;
    total += score * weight;
  }
  return Math.round(total);
}

// IVC seed data
const IVC_BASELINE_SCORE = {
  client_id: "ivc",
  client_name: "IVC",
  nas_score: 37,
  components: {
    usage_frequency:  { score: 35, raw: "~5 sessions/week",              target: "15 sessions/week"                       },
    workflow_coverage: { score: 20, raw: "~20% through platform",        target: "80% through platform"                   },
    user_penetration:  { score: 15, raw: "1 of 6 engineers",             target: "6 of 6 engineers"                       },
    investment_rate:   { score: 80, raw: "Active corrections per job",   target: "Corrections feeding Learning Library"   },
    velocity_trend:    { score: 55, direction: "up"                                                                       },
  },
  status: "at_risk",
  period: "2026-W13",
  calculated_at: new Date().toISOString(),
  data_source: "estimated",
  notes: "Manual baseline estimate. Sentinel structured logging deployed March 24, 2026. Real data will replace this once usage is captured.",
};

const IVC_CONFIG = {
  client_id: "ivc",
  client_name: "IVC",
  target_sessions_per_week: 15,
  target_users: 6,
  target_workflow_coverage_pct: 80,
  investment_multiplier: 2.0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function useAdoptionScores() {
  const [scores, setScores]   = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let s = await getData(SCORES_KEY);
      let c = await getData(CONFIG_KEY);

      if (!s || !Array.isArray(s) || s.length === 0) {
        s = [IVC_BASELINE_SCORE];
        await setData(SCORES_KEY, s);
      }
      if (!c || !Array.isArray(c) || c.length === 0) {
        c = [IVC_CONFIG];
        await setData(CONFIG_KEY, c);
      }

      setScores(s);
      setConfigs(c);
      setLoading(false);
    })();
  }, []);

  const saveScores = useCallback(async (updated) => {
    setScores(updated);
    await setData(SCORES_KEY, updated);
  }, []);

  const saveConfigs = useCallback(async (updated) => {
    setConfigs(updated);
    await setData(CONFIG_KEY, updated);
  }, []);

  const updateScore = useCallback(async (clientId, updates) => {
    const now = new Date().toISOString();
    const updated = scores.map(s =>
      s.client_id === clientId
        ? { ...s, ...updates, updated_at: now }
        : s
    );
    await saveScores(updated);
  }, [scores, saveScores]);

  const getConfig = useCallback((clientId) => {
    return configs.find(c => c.client_id === clientId) || null;
  }, [configs]);

  const aggregateNAS = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + (s.nas_score || 0), 0) / scores.length)
    : null;

  return { scores, configs, loading, updateScore, getConfig, saveScores, saveConfigs, aggregateNAS };
}
