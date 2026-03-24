/**
 * NASWidget — NIP Phase 3
 * Nouvia Adoption Score widget for the Dashboard INTELLIGENCE section.
 * Shows aggregate NAS + per-client breakdown with component bars.
 */
import { useState } from "react";
import {
  COMPONENT_LABELS,
  COMPONENT_DESCRIPTIONS,
  NAS_WEIGHTS,
  getScoreColor,
  getStatusFromScore,
  calculateNAS,
} from "../../hooks/useAdoptionScores";

/* ── Status badge ──────────────────────────────── */
const STATUS_STYLES = {
  healthy:  { bg: "var(--color-badge-green-bg)",  text: "var(--color-badge-green-text)",  label: "Healthy"  },
  on_track: { bg: "var(--color-badge-amber-bg)",  text: "var(--color-badge-amber-text)",  label: "On Track" },
  at_risk:  { bg: "var(--color-badge-amber-bg)",  text: "var(--color-badge-amber-text)",  label: "At Risk"  },
  critical: { bg: "var(--color-badge-red-bg)",    text: "var(--color-badge-red-text)",    label: "Critical" },
  pending:  { bg: "var(--color-badge-gray-bg)",   text: "var(--color-badge-gray-text)",   label: "Pending"  },
};

const SOURCE_STYLES = {
  estimated: { bg: "var(--color-badge-gray-bg)",  text: "var(--color-badge-gray-text)",  label: "Estimated" },
  sentinel:  { bg: "var(--color-badge-green-bg)", text: "var(--color-badge-green-text)", label: "Sentinel"  },
  manual:    { bg: "var(--color-badge-amber-bg)", text: "var(--color-badge-amber-text)", label: "Manual"    },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)",
      padding: "2px 8px", borderRadius: 999, backgroundColor: s.bg, color: s.text,
    }}>
      {s.label}
    </span>
  );
}

function SourceBadge({ source }) {
  const s = SOURCE_STYLES[source] || SOURCE_STYLES.estimated;
  return (
    <span style={{
      fontSize: 10, fontWeight: "var(--font-weight-medium)",
      padding: "1px 6px", borderRadius: 999, backgroundColor: s.bg, color: s.text,
    }}>
      {s.label}
    </span>
  );
}

/* ── Mini progress bar ─────────────────────────── */
function MiniBar({ score, label, weight }) {
  const color = getScoreColor(score);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 500 }}>
          {label} <span style={{ color: "var(--color-text-ghost)" }}>({Math.round(weight * 100)}%)</span>
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{score}</span>
      </div>
      <div style={{
        height: 4, borderRadius: 2, backgroundColor: "var(--color-bg-sunken)", overflow: "hidden",
      }}>
        <div style={{ height: "100%", width: `${Math.min(score, 100)}%`, backgroundColor: color, borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

/* ── Score ring ─────────────────────────────────── */
function ScoreRing({ score, size = 64 }) {
  const color = getScoreColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * (score ?? 0)) / 100;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-bg-sunken)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size > 50 ? 18 : 14, fontWeight: 700, color, fontVariantNumeric: "tabular-nums",
      }}>
        {score ?? "—"}
      </div>
    </div>
  );
}

/* ── Velocity arrow ────────────────────────────── */
function VelocityArrow({ direction }) {
  const arrows = { up: "↗", stable: "→", down: "↘" };
  const colors = { up: "#22c55e", stable: "#eab308", down: "#ef4444" };
  return (
    <span style={{ color: colors[direction] || colors.stable, fontSize: 12, fontWeight: 600 }}>
      {arrows[direction] || arrows.stable}
    </span>
  );
}

/* ── Client NAS card ───────────────────────────── */
function ClientScoreCard({ score, onSelect }) {
  const components = score.components || {};
  const trendDir = components.velocity_trend?.direction || "stable";

  return (
    <button
      onClick={() => onSelect(score)}
      style={{
        display: "block", width: "100%", textAlign: "left", cursor: "pointer",
        padding: "var(--space-4)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-elevated)",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        fontFamily: "var(--font-sans)",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-border-muted)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-default)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
        <ScoreRing score={score.nas_score} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: 2 }}>
            <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
              {score.client_name}
            </span>
            <StatusBadge status={score.status} />
            <SourceBadge source={score.data_source} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ fontSize: 10, color: "var(--color-text-ghost)" }}>
              {score.period}
            </span>
            <VelocityArrow direction={trendDir} />
          </div>
        </div>
      </div>

      {/* Component bars */}
      <div>
        {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
          <MiniBar
            key={key}
            score={components[key]?.score ?? 0}
            label={label}
            weight={NAS_WEIGHTS[key]}
          />
        ))}
      </div>

      {/* Notes */}
      {score.notes && (
        <p style={{ fontSize: 10, color: "var(--color-text-ghost)", marginTop: "var(--space-2)", fontStyle: "italic", lineHeight: 1.4 }}>
          {score.notes.length > 120 ? score.notes.substring(0, 120) + "…" : score.notes}
        </p>
      )}
    </button>
  );
}

/* ── NAS Detail View ───────────────────────────── */
function NASDetail({ score, config, onBack, onEdit }) {
  const components = score.components || {};

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <button onClick={onBack} style={{
        fontSize: "var(--font-size-xs)", color: "var(--color-text-subtle)", cursor: "pointer",
        background: "none", border: "none", marginBottom: "var(--space-4)", padding: 0,
      }}>
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <ScoreRing score={score.nas_score} size={80} />
        <div>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)", margin: 0 }}>
            {score.client_name} — Adoption Score
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: 4 }}>
            <StatusBadge status={score.status} />
            <SourceBadge source={score.data_source} />
            <span style={{ fontSize: 11, color: "var(--color-text-ghost)" }}>
              Period: {score.period} · Calculated: {new Date(score.calculated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={onEdit} style={{
            fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)",
            padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--color-btn-primary-bg)", color: "var(--color-btn-primary-text)",
            border: "none", cursor: "pointer",
          }}>
            Edit Score
          </button>
        </div>
      </div>

      {/* Component breakdown */}
      <div style={{
        padding: "var(--space-4)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-elevated)",
        marginBottom: "var(--space-4)",
      }}>
        <h3 style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-3)", margin: 0 }}>
          Component Breakdown
        </h3>
        <div style={{ marginTop: "var(--space-3)" }}>
          {Object.entries(COMPONENT_LABELS).map(([key, label]) => {
            const comp = components[key] || {};
            const weight = NAS_WEIGHTS[key];
            const color = getScoreColor(comp.score);
            return (
              <div key={key} style={{ marginBottom: "var(--space-4)", paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--color-border-default)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div>
                    <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-primary)" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-text-ghost)", marginLeft: 8 }}>
                      {Math.round(weight * 100)}% weight
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {key === "velocity_trend" && <VelocityArrow direction={comp.direction} />}
                    <span style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
                      {comp.score ?? 0}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "var(--color-text-subtle)", margin: "2px 0 6px", fontStyle: "italic" }}>
                  {COMPONENT_DESCRIPTIONS[key]}
                </p>
                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 3, backgroundColor: "var(--color-bg-sunken)", overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", width: `${Math.min(comp.score || 0, 100)}%`, backgroundColor: color, borderRadius: 3 }} />
                </div>
                {/* Raw / Target */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-ghost)" }}>
                  <span>Current: {comp.raw || "—"}</span>
                  <span>Target: {comp.target || "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adoption Config */}
      {config && (
        <div style={{
          padding: "var(--space-4)", borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-elevated)",
          marginBottom: "var(--space-4)",
        }}>
          <h3 style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: "var(--space-3)" }}>
            Adoption Targets
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            {[
              { label: "Sessions/Week", value: config.target_sessions_per_week },
              { label: "Target Users", value: config.target_users },
              { label: "Workflow Coverage", value: config.target_workflow_coverage_pct + "%" },
              { label: "Investment Multiplier", value: config.investment_multiplier + "×" },
            ].map(t => (
              <div key={t.label}>
                <span style={{ fontSize: 10, color: "var(--color-text-ghost)", display: "block" }}>{t.label}</span>
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical trend placeholder */}
      <div style={{
        padding: "var(--space-4)", borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--color-border-muted)", backgroundColor: "var(--color-bg-overlay)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }}>📈 Trend data available after 4 weeks of Sentinel data</p>
      </div>

      {/* Notes */}
      {score.notes && (
        <div style={{
          marginTop: "var(--space-4)", padding: "var(--space-3)", borderRadius: "var(--radius-md)",
          backgroundColor: "var(--color-bg-overlay)", border: "1px solid var(--color-border-default)",
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-ghost)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</span>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>{score.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ── Manual Score Edit ─────────────────────────── */
function NASEditForm({ score, onSave, onCancel }) {
  const [components, setComponents] = useState(() => {
    const c = {};
    for (const key of Object.keys(COMPONENT_LABELS)) {
      const existing = score.components?.[key] || {};
      c[key] = {
        score: existing.score ?? 0,
        raw: existing.raw || "",
        target: existing.target || "",
        ...(key === "velocity_trend" ? { direction: existing.direction || "stable" } : {}),
      };
    }
    return c;
  });
  const [notes, setNotes] = useState(score.notes || "");

  const updateComp = (key, field, value) => {
    setComponents(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: field === "score" ? Number(value) : value },
    }));
  };

  const compositeScore = calculateNAS(components);

  const handleSave = () => {
    onSave({
      nas_score: compositeScore,
      components,
      status: getStatusFromScore(compositeScore),
      data_source: "manual",
      calculated_at: new Date().toISOString(),
      notes,
    });
  };

  const inputStyle = {
    width: "100%", backgroundColor: "var(--color-bg-overlay)",
    border: "1px solid var(--color-border-muted)", borderRadius: "var(--radius-md)",
    padding: "6px 10px", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)",
    fontFamily: "var(--font-sans)",
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <ScoreRing score={compositeScore} size={56} />
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
            Edit {score.client_name} NAS
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-ghost)" }}>
            Composite: {compositeScore} (auto-calculated from weights)
          </p>
        </div>
      </div>

      {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
        <div key={key} style={{
          marginBottom: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-elevated)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)" }}>
              {label} ({Math.round(NAS_WEIGHTS[key] * 100)}%)
            </span>
            <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: getScoreColor(components[key].score), fontVariantNumeric: "tabular-nums" }}>
              {components[key].score}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <div style={{ flex: "0 0 60px" }}>
              <label style={{ fontSize: 10, color: "var(--color-text-ghost)", display: "block", marginBottom: 2 }}>Score</label>
              <input type="number" min={0} max={100} value={components[key].score}
                onChange={e => updateComp(key, "score", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: "var(--color-text-ghost)", display: "block", marginBottom: 2 }}>Current</label>
              <input value={components[key].raw} onChange={e => updateComp(key, "raw", e.target.value)} style={inputStyle} placeholder="e.g. 5 sessions/week" />
            </div>
            {key !== "velocity_trend" && (
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: "var(--color-text-ghost)", display: "block", marginBottom: 2 }}>Target</label>
                <input value={components[key].target} onChange={e => updateComp(key, "target", e.target.value)} style={inputStyle} />
              </div>
            )}
            {key === "velocity_trend" && (
              <div style={{ flex: "0 0 100px" }}>
                <label style={{ fontSize: 10, color: "var(--color-text-ghost)", display: "block", marginBottom: 2 }}>Direction</label>
                <select value={components[key].direction} onChange={e => updateComp(key, "direction", e.target.value)} style={inputStyle}>
                  <option value="up">↗ Up</option>
                  <option value="stable">→ Stable</option>
                  <option value="down">↘ Down</option>
                </select>
              </div>
            )}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label style={{ fontSize: 10, color: "var(--color-text-ghost)", display: "block", marginBottom: 2 }}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, resize: "none", minHeight: 60 }} placeholder="Context about this score update..." />
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <button onClick={handleSave} style={{
          flex: 1, padding: "var(--space-2)", borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-btn-primary-bg)", color: "var(--color-btn-primary-text)",
          border: "none", cursor: "pointer", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)",
        }}>
          Save Score
        </button>
        <button onClick={onCancel} style={{
          flex: 1, padding: "var(--space-2)", borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-bg-overlay)", color: "var(--color-text-secondary)",
          border: "1px solid var(--color-border-muted)", cursor: "pointer", fontSize: "var(--font-size-sm)",
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Main NAS Widget (for Dashboard) ───────────── */
export default function NASWidget() {
  return null; // Rendered via NASSection below
}

export function NASSection({ scores, configs, aggregateNAS, loading, updateScore, getConfig, onNavigateToDetail }) {
  if (loading) {
    return (
      <div style={{
        padding: "var(--space-6) var(--space-4)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-elevated)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-subtle)", margin: 0 }}>Loading adoption scores...</p>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "var(--space-6) var(--space-4)", borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--color-border-muted)", backgroundColor: "var(--color-bg-overlay)",
      }}>
        <div style={{ fontSize: 28, marginBottom: "var(--space-2)", opacity: 0.4 }}>📈</div>
        <p style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-muted)", margin: 0 }}>
          No adoption scores yet
        </p>
      </div>
    );
  }

  const aggStatus = getStatusFromScore(aggregateNAS);

  return (
    <div style={{
      padding: "var(--space-4)", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-elevated)",
    }}>
      {/* Aggregate header */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <ScoreRing score={aggregateNAS} size={64} />
        <div>
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
            Nouvia Adoption Score
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: 2 }}>
            <StatusBadge status={aggStatus} />
            <span style={{ fontSize: 10, color: "var(--color-text-ghost)" }}>
              {scores.length} client{scores.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Per-client cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {scores.map(score => (
          <ClientScoreCard
            key={score.client_id}
            score={score}
            onSelect={onNavigateToDetail}
          />
        ))}
      </div>
    </div>
  );
}

export { NASDetail, NASEditForm, ScoreRing, StatusBadge };
