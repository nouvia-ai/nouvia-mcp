/**
 * useGovernanceQueue — NIP Phase 6
 * Manages governance_queue items from Firestore (user-scoped storage).
 * Seeds 5 baseline governance items on first load.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { getData, setData } from "../storage";

const STORAGE_KEY = "strategist:governance_queue";

// Priority ordering
export const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };
export const PRIORITY_COLORS = {
  urgent: "#ef4444", high: "#f97316", normal: "#eab308", low: "#6b7280"
};
export const PRIORITY_ICONS = {
  urgent: "\ud83d\udd34", high: "\ud83d\udd34", normal: "\ud83d\udfe1", low: "\u26aa"
};
export const TYPE_LABELS = {
  experiment_proposed: "Experiment",
  canvas_flag: "Canvas",
  risk_action: "Risk",
  adoption_alert: "Adoption",
  funnel_falldown: "Funnel",
  website_stale: "Website",
  goal_off_pace: "Goal",
  decision_needed: "Decision",
  loop_output: "Loop Output",
};
export const TYPE_COLORS = {
  experiment_proposed: "#8b5cf6",
  canvas_flag: "#3b82f6",
  risk_action: "#ef4444",
  adoption_alert: "#f97316",
  funnel_falldown: "#eab308",
  website_stale: "#06b6d4",
  goal_off_pace: "#ec4899",
  decision_needed: "#6366f1",
  loop_output: "#22c55e",
};
export const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  killed: "Killed",
  modified: "Modified",
  deferred: "Deferred",
};

const uuid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function buildSeedItems() {
  const now = new Date().toISOString();
  const base = { created_at: now, updated_at: now, resolved_at: null, resolution_notes: "", expires_at: null };

  return [
    {
      ...base,
      id: uuid(),
      title: "IVC adoption at 37/100 \u2014 adoption sprint recommended",
      type: "adoption_alert",
      source: "nas_monitor",
      priority: "high",
      description: "IVC's Nouvia Adoption Score is 37 (At Risk). Only 1 of 6 target engineers is active. Most floorplan jobs are still processed manually. Rule 2.14 states: never expand before adoption is confirmed. The estimation build should not proceed until adoption improves.",
      recommended_action: "Propose an adoption sprint to IVC alongside the estimation build. Target: NAS > 60 within 60 days. Two parallel workstreams: deepen floorplan adoption + build estimation foundation.",
      options: [
        { label: "Approve adoption sprint", description: "Add adoption sprint to IVC backlog alongside estimation" },
        { label: "Proceed with estimation only", description: "Accept the adoption risk and build estimation without an adoption sprint" },
        { label: "Defer estimation until NAS > 60", description: "Pause estimation entirely until adoption is proven" },
      ],
      related_collection: "adoption_scores",
      related_doc_id: "ivc",
      goal_title: "Achieve Product-Market Fit \u2014 5 paying clients on managed platform by June 30, 2026",
      status: "pending",
    },
    {
      ...base,
      id: uuid(),
      title: "3 Funnel items have no confirmed next step \u2014 Falldown candidates",
      type: "funnel_falldown",
      source: "funnel_automation",
      priority: "high",
      description: "Three IVC expansion deals in the Funnel are at Gathering Info (25%) with next step dates approaching or past due: SolidWorks + ERP Integration (Mar 31), Estimation Platform (Apr 15), ESSOR Discovery (Apr 1). Under DEI methodology, a prospect without an active next step is a Falldown. Review each and either set a concrete next step or move to Falldown.",
      recommended_action: "Review each prospect. For ERP Integration: schedule the data assessment session. For Estimation: defer next step until ERP integration progresses. For ESSOR: schedule the discovery kickoff.",
      options: [],
      related_collection: "pipeline",
      related_doc_id: null,
      goal_title: "Generate $1,000,000 in revenue by December 31, 2026",
      status: "pending",
    },
    {
      ...base,
      id: uuid(),
      title: "Website positioning is stale \u2014 canvas has evolved",
      type: "website_stale",
      source: "risk_intelligence",
      priority: "normal",
      description: "nouvia.ai was last updated around March 10. The canvas has evolved significantly since then: AI adoption guarantee, self-evolving delivery system, build standard, and the NIP three-layer architecture are not reflected on the website.",
      recommended_action: "Schedule website redesign after NIP is stable. Not urgent \u2014 direct sales is the active channel \u2014 but becomes important once content marketing activates.",
      options: [],
      related_collection: "channels",
      related_doc_id: null,
      goal_title: "Achieve Product-Market Fit \u2014 5 paying clients on managed platform by June 30, 2026",
      status: "pending",
    },
    {
      ...base,
      id: uuid(),
      title: "PMF goal may need timeline adjustment",
      type: "goal_off_pace",
      source: "manual",
      priority: "normal",
      description: "Goal: 5 paying clients on managed platform by June 30, 2026. Current: 1 client. Pipeline: 0 non-IVC prospects. 3 months remaining. Achieving this goal requires closing 4 new clients with zero current pipeline activity. Either the goal needs a timeline extension or traction channels need immediate activation.",
      recommended_action: "Two options: (1) Adjust goal to '3 paying clients by December 2026' which is ambitious but realistic, or (2) Commit to 50% time on traction starting this week \u2014 content, outreach, referral asks.",
      options: [
        { label: "Adjust goal timeline", description: "Change deadline to December 2026 with 3 clients target" },
        { label: "Activate traction now", description: "Commit 50% of time to pipeline building starting this week" },
        { label: "Both", description: "Adjust timeline AND activate traction \u2014 realistic goal with real effort" },
      ],
      related_collection: "goals",
      related_doc_id: null,
      goal_title: "Achieve Product-Market Fit \u2014 5 paying clients on managed platform by June 30, 2026",
      status: "pending",
    },
    {
      ...base,
      id: uuid(),
      title: "First BSP weekly digest arriving Monday March 30",
      type: "loop_output",
      source: "bsp_weekly_scan",
      priority: "normal",
      description: "The autonomous BSP weekly market scan is scheduled for Monday March 30 at 6 AM ET. This is the first automated run. The digest will be emailed to benmelchionno@nouvia.ai. Review it to validate the loop is producing useful signal.",
      recommended_action: "Check your inbox Monday morning. Review the digest for signal quality. If the format or content needs tuning, update the prompt in services/bsp-loop-runner/prompts/weekly-scan.md and push to main \u2014 CI/CD will auto-deploy.",
      options: [],
      related_collection: null,
      related_doc_id: null,
      goal_title: "Complete Nouvia OS \u2014 fully operational AI delivery system by April 30, 2026",
      status: "pending",
    },
  ];
}

export default function useGovernanceQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let data = await getData(STORAGE_KEY);
      // Reseed if data is missing goal_title (Phase 6 design audit upgrade)
      if (!data || !Array.isArray(data) || data.length === 0 || (data[0] && !data[0].goal_title)) {
        data = buildSeedItems();
        await setData(STORAGE_KEY, data);
      }
      setItems(data);
      setLoading(false);
    })();
  }, []);

  const saveItems = useCallback(async (updated) => {
    setItems(updated);
    await setData(STORAGE_KEY, updated);
  }, []);

  const pendingItems = useMemo(() =>
    items
      .filter(i => i.status === "pending")
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) || new Date(b.created_at) - new Date(a.created_at)),
    [items]
  );

  const resolvedItems = useMemo(() =>
    items
      .filter(i => i.status !== "pending")
      .sort((a, b) => new Date(b.resolved_at || b.updated_at) - new Date(a.resolved_at || a.updated_at)),
    [items]
  );

  const pendingCount = pendingItems.length;

  const resolveItem = useCallback(async (itemId, status, notes = "", selectedOption = null) => {
    const now = new Date().toISOString();
    const updated = items.map(i =>
      i.id === itemId
        ? { ...i, status, resolution_notes: notes, selected_option: selectedOption, resolved_at: now, updated_at: now }
        : i
    );
    await saveItems(updated);
  }, [items, saveItems]);

  const addItem = useCallback(async (itemData) => {
    const now = new Date().toISOString();
    const newItem = {
      id: uuid(),
      created_at: now,
      updated_at: now,
      resolved_at: null,
      resolution_notes: "",
      expires_at: null,
      options: [],
      related_collection: null,
      related_doc_id: null,
      status: "pending",
      ...itemData,
    };
    const updated = [...items, newItem];
    await saveItems(updated);
    return newItem;
  }, [items, saveItems]);

  return { items, loading, pendingItems, resolvedItems, pendingCount, resolveItem, addItem };
}
