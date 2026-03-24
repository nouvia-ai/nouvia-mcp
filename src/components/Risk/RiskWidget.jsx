/**
 * RiskWidget — NIP Phase 4
 * Dashboard Risk Signals widget + detail/edit views.
 * Three-column horizon layout: Short-term | Mid-term | Long-term
 */
import { useState } from "react";
import {
  SEVERITY_ORDER,
  SEVERITY_COLORS,
  SEVERITY_VARIANTS,
  HORIZON_LABELS,
  MITIGATION_LABELS,
} from "../../hooks/useRiskAssessments";

/* ── Badge helper ─────────────────────────────── */
const BADGE_STYLES = {
  red:     { bg: "var(--color-badge-red-bg)",    text: "var(--color-badge-red-text)"    },
  amber:   { bg: "var(--color-badge-amber-bg)",  text: "var(--color-badge-amber-text)"  },
  green:   { bg: "var(--color-badge-green-bg)",  text: "var(--color-badge-green-text)"  },
  blue:    { bg: "var(--color-badge-blue-bg)",    text: "var(--color-badge-blue-text)"    },
  gray:    { bg: "var(--color-badge-gray-bg)",   text: "var(--color-badge-gray-text)"   },
  purple:  { bg: "var(--color-badge-purple-bg)", text: "var(--color-badge-purple-text)" },
};

function Badge({ children, variant = "gray" }) {
  const s = BADGE_STYLES[variant] || BADGE_STYLES.gray;
  return (
    <span style={{
      fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)",
      padding: "2px 8px", borderRadius: 999, backgroundColor: s.bg, color: s.text,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

/* ── Severity dot ─────────────────────────────── */
function SeverityDot({ severity }) {
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8, borderRadius: "50%",
      backgroundColor: SEVERITY_COLORS[severity] || "#888",
      flexShrink: 0,
      marginTop: 5,
    }} />
  );
}

/* ── Likelihood badge variant ─────────────────── */
function likelihoodVariant(l) {
  return { near_certain: "red", likely: "amber", possible: "blue", unlikely: "green" }[l] || "gray";
}
function likelihoodLabel(l) {
  return { near_certain: "Near Certain", likely: "Likely", possible: "Possible", unlikely: "Unlikely" }[l] || l;
}

/* ── Mitigation badge variant ─────────────────── */
function mitigationVariant(m) {
  return { unmitigated: "red", partially_mitigated: "amber", mitigated: "green" }[m] || "gray";
}

/* ── Status badge variant ─────────────────────── */
function statusVariant(s) {
  return { active: "red", monitoring: "amber", resolved: "green", accepted: "blue" }[s] || "gray";
}
function statusLabel(s) {
  return { active: "Active", monitoring: "Monitoring", resolved: "Resolved", accepted: "Accepted" }[s] || s;
}

/* ── Sort risks by severity ───────────────────── */
function sortBySeverity(risks) {
  return [...risks].sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );
}

/* ── Risk Card (used in column view) ──────────── */
function RiskCard({ risk, onClick }) {
  return (
    <div
      onClick={() => onClick?.(risk)}
      style={{
        display: "flex", gap: 8, alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-muted)",
        backgroundColor: "var(--color-bg-elevated)",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-strong)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-muted)"}
    >
      <SeverityDot severity={risk.severity} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)",
          color: "var(--color-text-primary)", lineHeight: 1.35,
          marginBottom: 6,
        }}>
          {risk.title}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Badge variant={likelihoodVariant(risk.likelihood)}>{likelihoodLabel(risk.likelihood)}</Badge>
          <Badge variant={mitigationVariant(risk.mitigation_status)}>{MITIGATION_LABELS[risk.mitigation_status] || risk.mitigation_status}</Badge>
        </div>
      </div>
    </div>
  );
}

/* ── Horizon Column ───────────────────────────── */
function HorizonColumn({ label, timeframe, risks, onSelectRisk }) {
  const sorted = sortBySeverity(risks);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 8,
      }}>
        <div>
          <span style={{
            fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-primary)",
          }}>
            {label}
          </span>
          <span style={{
            fontSize: "var(--font-size-xs)", color: "var(--color-text-subtle)",
            marginLeft: 6,
          }}>
            {timeframe}
          </span>
        </div>
        <span style={{
          fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)",
          color: "var(--color-text-ghost)",
        }}>
          {sorted.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.length === 0 && (
          <div style={{
            padding: "16px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--color-border-muted)",
            textAlign: "center",
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-ghost)",
          }}>
            No risks
          </div>
        )}
        {sorted.map(r => (
          <RiskCard key={r.id} risk={r} onClick={onSelectRisk} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   RiskSignalsSection — Dashboard widget
   ═══════════════════════════════════════════════════ */
export function RiskSignalsSection({ risks, loading, onSelectRisk }) {
  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "var(--space-6) var(--space-4)",
        borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--color-border-muted)",
        backgroundColor: "var(--color-bg-overlay)",
        flex: 1, minWidth: 0,
      }}>
        <div style={{ fontSize: 28, marginBottom: "var(--space-2)", opacity: 0.4 }}>&#9889;</div>
        <p style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-muted)", margin: 0, marginBottom: 4 }}>Risk Signals</p>
        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-subtle)", margin: 0 }}>Loading risk data...</p>
      </div>
    );
  }

  const activeRisks = (risks || []).filter(r => r.status === "active" || r.status === "monitoring");
  const shortTerm = activeRisks.filter(r => r.horizon === "short_term");
  const midTerm   = activeRisks.filter(r => r.horizon === "mid_term");
  const longTerm  = activeRisks.filter(r => r.horizon === "long_term");

  const totalActive = activeRisks.length;
  const critHigh = activeRisks.filter(r => r.severity === "critical" || r.severity === "high").length;

  return (
    <div style={{
      flex: 1, minWidth: 0,
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-border-default)",
      backgroundColor: "var(--color-bg-surface)",
      padding: "16px",
      fontFamily: "var(--font-sans)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>&#9889;</span>
          <span style={{
            fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-primary)",
          }}>
            Risk Signals
          </span>
          <Badge variant={critHigh > 0 ? "red" : "green"}>
            {totalActive} active{critHigh > 0 ? ` \u00B7 ${critHigh} high+` : ""}
          </Badge>
        </div>
      </div>

      {/* Three-column horizon layout */}
      <div style={{ display: "flex", gap: 12 }}>
        <HorizonColumn label="Short-term" timeframe="0-30 days" risks={shortTerm} onSelectRisk={onSelectRisk} />
        <HorizonColumn label="Mid-term" timeframe="1-6 months" risks={midTerm} onSelectRisk={onSelectRisk} />
        <HorizonColumn label="Long-term" timeframe="6+ months" risks={longTerm} onSelectRisk={onSelectRisk} />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   RiskDetail — Full risk detail view
   ═══════════════════════════════════════════════════ */
export function RiskDetail({ risk, onBack, onUpdate }) {
  if (!risk) return null;

  const sevColor = SEVERITY_COLORS[risk.severity] || "#888";

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 720 }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "var(--font-size-xs)", color: "var(--color-text-subtle)",
          padding: 0, marginBottom: 16,
        }}
      >
        &larr; Back to Dashboard
      </button>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <SeverityDot severity={risk.severity} />
          <h2 style={{
            margin: 0, fontSize: 18, fontWeight: 700,
            color: "var(--color-text-primary)", lineHeight: 1.3,
          }}>
            {risk.title}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Badge variant={SEVERITY_VARIANTS[risk.severity]}>{risk.severity?.charAt(0).toUpperCase() + risk.severity?.slice(1)}</Badge>
          <Badge variant={likelihoodVariant(risk.likelihood)}>{likelihoodLabel(risk.likelihood)}</Badge>
          <Badge variant={mitigationVariant(risk.mitigation_status)}>{MITIGATION_LABELS[risk.mitigation_status] || risk.mitigation_status}</Badge>
          <Badge variant={statusVariant(risk.status)}>{statusLabel(risk.status)}</Badge>
          <Badge variant="gray">{HORIZON_LABELS[risk.horizon] || risk.horizon}</Badge>
        </div>
      </div>

      {/* Description */}
      <DetailSection label="Description">
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
          {risk.description}
        </p>
      </DetailSection>

      {/* Delivery Intelligence Rule */}
      {risk.delivery_intelligence_rule && (
        <DetailSection label="Delivery Intelligence Rule">
          <div style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-bg-overlay)",
            border: "1px solid var(--color-border-muted)",
          }}>
            <div style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)", marginBottom: 4 }}>
              {risk.delivery_intelligence_rule}
            </div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-subtle)", fontStyle: "italic" }}>
              {risk.rule_summary}
            </div>
          </div>
        </DetailSection>
      )}

      {/* Recommended Action */}
      {risk.recommended_action && (
        <DetailSection label="Recommended Action">
          <div style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-bg-overlay)",
            border: "1px solid var(--color-border-muted)",
            fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5,
          }}>
            {risk.recommended_action}
          </div>
        </DetailSection>
      )}

      {/* Metadata */}
      <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
        {risk.data_sources && risk.data_sources.length > 0 && (
          <DetailSection label="Data Sources" compact>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {risk.data_sources.map(ds => <Badge key={ds} variant="gray">{ds}</Badge>)}
            </div>
          </DetailSection>
        )}
        {risk.affected_canvas_blocks && risk.affected_canvas_blocks.length > 0 && (
          <DetailSection label="Affected Canvas Blocks" compact>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {risk.affected_canvas_blocks.map(b => <Badge key={b} variant="purple">{b.replace(/_/g, " ")}</Badge>)}
            </div>
          </DetailSection>
        )}
      </div>

      {/* Time info */}
      <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
        <MetaField label="Time to Impact" value={risk.time_to_impact} />
        <MetaField label="Client" value={risk.client_id || "All / Nouvia"} />
        <MetaField label="Source" value={risk.source} />
      </div>

      {/* Notes */}
      {risk.notes && (
        <DetailSection label="Notes">
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: 0 }}>
            {risk.notes}
          </p>
        </DetailSection>
      )}

      {/* Edit button */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={onUpdate}
          style={{
            padding: "8px 20px", borderRadius: "var(--radius-md)",
            border: "none", cursor: "pointer",
            fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)",
            backgroundColor: "var(--color-btn-primary-bg)",
            color: "var(--color-btn-primary-text)",
            transition: "background-color 0.15s",
          }}
        >
          Edit Risk
        </button>
      </div>
    </div>
  );
}

function DetailSection({ label, children, compact }) {
  return (
    <div style={{ marginBottom: compact ? 0 : 16 }}>
      <div style={{
        fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)",
        color: "var(--color-text-ghost)", textTransform: "uppercase", letterSpacing: "0.05em",
        marginBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function MetaField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-ghost)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
        {value}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   RiskEditForm — Edit form for risk fields
   ═══════════════════════════════════════════════════ */
export function RiskEditForm({ risk, onSave, onCancel }) {
  const [form, setForm] = useState({
    title:                       risk.title || "",
    description:                 risk.description || "",
    horizon:                     risk.horizon || "short_term",
    severity:                    risk.severity || "medium",
    likelihood:                  risk.likelihood || "possible",
    time_to_impact:              risk.time_to_impact || "days",
    mitigation_status:           risk.mitigation_status || "unmitigated",
    delivery_intelligence_rule:  risk.delivery_intelligence_rule || "",
    rule_summary:                risk.rule_summary || "",
    recommended_action:          risk.recommended_action || "",
    status:                      risk.status || "active",
    notes:                       risk.notes || "",
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    backgroundColor: "var(--color-bg-overlay)",
    border: "1px solid var(--color-border-muted)",
    borderRadius: "var(--radius-md)",
    padding: "8px 12px",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-primary)",
    outline: "none",
    fontFamily: "var(--font-sans)",
  };

  const selectStyle = { ...inputStyle, appearance: "none" };
  const textareaStyle = { ...inputStyle, resize: "vertical", minHeight: 60 };

  const labelStyle = {
    display: "block",
    fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)",
    color: "var(--color-text-muted)",
    marginBottom: 4,
  };

  const fieldStyle = { marginBottom: 14 };

  const handleSave = () => {
    onSave({
      ...form,
      horizon_label: HORIZON_LABELS[form.horizon] || "",
      resolved_at: form.status === "resolved" ? new Date().toISOString() : risk.resolved_at,
    });
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 600 }}>
      <button
        onClick={onCancel}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "var(--font-size-xs)", color: "var(--color-text-subtle)",
          padding: 0, marginBottom: 16,
        }}
      >
        &larr; Cancel
      </button>

      <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
        Edit Risk
      </h3>

      <div style={fieldStyle}>
        <label style={labelStyle}>Title</label>
        <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Description</label>
        <textarea style={textareaStyle} rows={4} value={form.description} onChange={e => set("description", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 12, ...fieldStyle }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Horizon</label>
          <select style={selectStyle} value={form.horizon} onChange={e => set("horizon", e.target.value)}>
            <option value="short_term">Short-term (0-30 days)</option>
            <option value="mid_term">Mid-term (1-6 months)</option>
            <option value="long_term">Long-term (6+ months)</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Severity</label>
          <select style={selectStyle} value={form.severity} onChange={e => set("severity", e.target.value)}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, ...fieldStyle }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Likelihood</label>
          <select style={selectStyle} value={form.likelihood} onChange={e => set("likelihood", e.target.value)}>
            <option value="near_certain">Near Certain</option>
            <option value="likely">Likely</option>
            <option value="possible">Possible</option>
            <option value="unlikely">Unlikely</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Time to Impact</label>
          <select style={selectStyle} value={form.time_to_impact} onChange={e => set("time_to_impact", e.target.value)}>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="quarters">Quarters</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, ...fieldStyle }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Mitigation Status</label>
          <select style={selectStyle} value={form.mitigation_status} onChange={e => set("mitigation_status", e.target.value)}>
            <option value="unmitigated">Unmitigated</option>
            <option value="partially_mitigated">Partially Mitigated</option>
            <option value="mitigated">Mitigated</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Status</label>
          <select style={selectStyle} value={form.status} onChange={e => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Delivery Intelligence Rule</label>
        <input style={inputStyle} value={form.delivery_intelligence_rule} onChange={e => set("delivery_intelligence_rule", e.target.value)} placeholder="e.g. Rule 2.45" />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Rule Summary</label>
        <input style={inputStyle} value={form.rule_summary} onChange={e => set("rule_summary", e.target.value)} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Recommended Action</label>
        <textarea style={textareaStyle} rows={3} value={form.recommended_action} onChange={e => set("recommended_action", e.target.value)} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea style={textareaStyle} rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes..." />
      </div>

      {/* Save / Cancel */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: "8px 16px", borderRadius: "var(--radius-md)",
            border: "none", cursor: "pointer",
            fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)",
            backgroundColor: "var(--color-btn-primary-bg)",
            color: "var(--color-btn-primary-text)",
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "8px 16px", borderRadius: "var(--radius-md)",
            border: "none", cursor: "pointer",
            fontSize: "var(--font-size-sm)",
            backgroundColor: "var(--color-bg-overlay)",
            color: "var(--color-text-secondary)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
