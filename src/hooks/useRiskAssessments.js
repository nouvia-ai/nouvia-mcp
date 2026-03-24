/**
 * useRiskAssessments — NIP Phase 4
 * Manages risk_assessments from Firestore (user-scoped storage).
 * Seeds 7 baseline risks on first load.
 */
import { useState, useEffect, useCallback } from "react";
import { getData, setData } from "../storage";

const STORAGE_KEY = "strategist:risk_assessments";

// Status helpers
export const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
export const SEVERITY_COLORS = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e"
};
export const SEVERITY_VARIANTS = {
  critical: "red", high: "amber", medium: "amber", low: "green"
};
export const HORIZON_LABELS = {
  short_term: "0-30 days", mid_term: "1-6 months", long_term: "6+ months"
};
export const MITIGATION_LABELS = {
  unmitigated: "Unmitigated", partially_mitigated: "Partially Mitigated", mitigated: "Mitigated"
};

const uuid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function buildSeedRisks() {
  const now = new Date().toISOString();
  const base = { created_at: now, updated_at: now, resolved_at: null, status: "active", source: "manual" };

  return [
    // SHORT-TERM
    {
      ...base,
      id: uuid(),
      title: "IVC ERP integration blocked \u2014 3 open data items unresolved",
      horizon: "short_term",
      horizon_label: HORIZON_LABELS.short_term,
      severity: "high",
      likelihood: "near_certain",
      time_to_impact: "days",
      mitigation_status: "unmitigated",
      description: "The SolidWorks PDM + Genius ERP integration requires 3 data items from IVC: (1) ERP data cleansing workstream owner, (2) costing method confirmation in Genius, (3) acceptable threshold between standard cost and last purchase price. These have been open since March 17. Without resolution, the estimation platform build cannot proceed.",
      delivery_intelligence_rule: "Rule 2.45",
      rule_summary: "Data quality is a discovery question, not an IT question",
      recommended_action: "Schedule dedicated IVC data assessment session this week. Frame as: 'We need 30 minutes with whoever owns the Genius ERP data to answer 3 specific questions before we can build the estimation tool.'",
      data_sources: ["backlog_status", "client_notes"],
      affected_canvas_blocks: ["key_activities", "revenue_streams"],
      client_id: "ivc",
    },
    {
      ...base,
      id: uuid(),
      title: "IVC Phase 1 invoice \u2014 $30k ready to invoice but not yet sent",
      horizon: "short_term",
      horizon_label: HORIZON_LABELS.short_term,
      severity: "medium",
      likelihood: "near_certain",
      time_to_impact: "days",
      mitigation_status: "unmitigated",
      description: "Phase 1 Floorplan Takeoff Platform delivered March 19. $30k ready to invoice per the cockpit data. Invoice not yet sent. Cash flow impact if delayed.",
      delivery_intelligence_rule: "Rule 2.19",
      rule_summary: "Track MRR impact on every decision",
      recommended_action: "Send invoice this week.",
      data_sources: ["financial_summary"],
      affected_canvas_blocks: ["revenue_streams", "cost_structure"],
      client_id: "ivc",
    },
    // MID-TERM
    {
      ...base,
      id: uuid(),
      title: "Single-client dependency \u2014 100% of revenue from IVC",
      horizon: "mid_term",
      horizon_label: HORIZON_LABELS.mid_term,
      severity: "high",
      likelihood: "near_certain",
      time_to_impact: "months",
      mitigation_status: "unmitigated",
      description: "All current and pipeline revenue comes from IVC. No other prospects in the Funnel pipeline. Goal of 5 paying clients by June 30, 2026 requires 4 more clients in 3 months with zero pipeline activity toward that goal.",
      delivery_intelligence_rule: "Rule 2.34",
      rule_summary: "IVC must become ecstatically happy before Client 2 \u2014 but Client 2 pipeline must start now",
      recommended_action: "Begin Targets identification for Client 2. Use IVC Segment Zero profile: owner-operated traditional business, 10-50 employees, manual workflows, cost pressure, at least one commercial forcing function. Allocate 50% of non-delivery time to traction (Traction framework 50% rule).",
      data_sources: ["pipeline_status", "goals", "financial_summary"],
      affected_canvas_blocks: ["customer_segments", "channels", "revenue_streams"],
      client_id: null,
    },
    {
      ...base,
      id: uuid(),
      title: "IVC platform adoption at 37/100 \u2014 below expansion threshold",
      horizon: "mid_term",
      horizon_label: HORIZON_LABELS.mid_term,
      severity: "high",
      likelihood: "likely",
      time_to_impact: "months",
      mitigation_status: "partially_mitigated",
      description: "NAS score of 37 (At Risk). Only 1 of 6 target engineers actively using the platform. Most floorplan jobs still processed manually. Expanding to estimation before adoption is proven risks two partially-adopted workflows instead of one strong one.",
      delivery_intelligence_rule: "Rule 2.14",
      rule_summary: "Never expand before adoption is confirmed",
      recommended_action: "Propose adoption sprint alongside estimation build \u2014 two parallel workstreams. Set target: NAS > 60 within 60 days. Track weekly.",
      data_sources: ["adoption_scores", "client_notes"],
      affected_canvas_blocks: ["value_propositions", "customer_relationships"],
      client_id: "ivc",
    },
    {
      ...base,
      id: uuid(),
      title: "PMF goal off pace \u2014 1 of 5 clients with 3 months remaining",
      horizon: "mid_term",
      horizon_label: HORIZON_LABELS.mid_term,
      severity: "medium",
      likelihood: "likely",
      time_to_impact: "months",
      mitigation_status: "unmitigated",
      description: "Goal: 5 paying clients on managed platform by June 30, 2026. Current: 1 client (IVC). Pipeline: 0 non-IVC prospects. Achieving this goal requires closing 4 new clients in 90 days with no active pipeline.",
      delivery_intelligence_rule: "Rule 2.33",
      rule_summary: "Define the OMTM at engagement start",
      recommended_action: "Either adjust the goal timeline to be realistic or activate traction channels immediately. Content marketing, speaking, referral asks from IVC contacts.",
      data_sources: ["goals", "pipeline_status"],
      affected_canvas_blocks: ["channels", "customer_segments"],
      client_id: null,
    },
    // LONG-TERM
    {
      ...base,
      id: uuid(),
      title: "Founder dependency \u2014 all client relationships and delivery are Ben-dependent",
      horizon: "long_term",
      horizon_label: HORIZON_LABELS.long_term,
      severity: "high",
      likelihood: "near_certain",
      time_to_impact: "quarters",
      mitigation_status: "partially_mitigated",
      description: "Ben is the sole delivery resource, sole sales channel, sole client relationship holder, and sole strategist. If Ben is unavailable for any reason, all client work and business development stops. The coworker chain (Nouvia OS) is partially mitigating this by systematizing delivery, but client relationships remain entirely Ben-dependent.",
      delivery_intelligence_rule: "Rule 2.42 + Pattern 3.20",
      rule_summary: "Know each contact, not just each client \u2014 and systematize that knowledge",
      recommended_action: "Continue CIF development with contact-level behavioral notes. Build Compass autonomy for proactive client communication. Long-term: first hire should be delivery, not sales.",
      data_sources: ["canvas_state", "coworker_coverage"],
      affected_canvas_blocks: ["key_resources", "key_activities", "cost_structure"],
      client_id: null,
    },
    {
      ...base,
      id: uuid(),
      title: "Second curve neglect \u2014 platform IP not building fast enough",
      horizon: "long_term",
      horizon_label: HORIZON_LABELS.long_term,
      severity: "medium",
      likelihood: "possible",
      time_to_impact: "quarters",
      mitigation_status: "partially_mitigated",
      description: "Nouvia's long-term value comes from accumulated platform IP (Nouvia OS, Core Components, Delivery Intelligence). Current focus is heavily weighted toward first-curve consulting delivery for IVC. The BSP infrastructure deployed today partially mitigates this, but coworker skills, Core Components, and the knowledge base need continued investment.",
      delivery_intelligence_rule: "Rule 2.32",
      rule_summary: "Start the second curve now, not when the first plateaus",
      recommended_action: "Protect weekly time blocks for second-curve work: skill development, Core Component extraction, Delivery Intelligence updates. Every IVC deliverable should produce at least one reusable asset.",
      data_sources: ["canvas_state", "coworker_status", "core_components"],
      affected_canvas_blocks: ["key_resources", "value_propositions"],
      client_id: null,
    },
  ];
}

export default function useRiskAssessments() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let data = await getData(STORAGE_KEY);

      if (!data || !Array.isArray(data) || data.length === 0) {
        data = buildSeedRisks();
        await setData(STORAGE_KEY, data);
      }

      setRisks(data);
      setLoading(false);
    })();
  }, []);

  const saveRisks = useCallback(async (updated) => {
    setRisks(updated);
    await setData(STORAGE_KEY, updated);
  }, []);

  const updateRisk = useCallback(async (riskId, updates) => {
    const now = new Date().toISOString();
    const updated = risks.map(r =>
      r.id === riskId
        ? { ...r, ...updates, updated_at: now }
        : r
    );
    await saveRisks(updated);
  }, [risks, saveRisks]);

  const addRisk = useCallback(async (riskData) => {
    const now = new Date().toISOString();
    const newRisk = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      created_at: now,
      updated_at: now,
      resolved_at: null,
      status: "active",
      source: "manual",
      horizon_label: HORIZON_LABELS[riskData.horizon] || "",
      ...riskData,
    };
    const updated = [...risks, newRisk];
    await saveRisks(updated);
    return newRisk;
  }, [risks, saveRisks]);

  return { risks, loading, updateRisk, addRisk, saveRisks };
}
