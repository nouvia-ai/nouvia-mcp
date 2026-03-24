/**
 * CompetitiveLandscapeTab — NIP BSP Section
 * Three views: Competitor Registry, Comparison Matrix, Gap Analysis + SWOT
 * Includes Add/Edit forms for competitors, matrix cells, and analysis.
 */
import { useState, useMemo } from "react";
import {
  useCompetitiveLandscape,
  COMPETITOR_TYPES,
  THREAT_LEVELS,
  COMPARISON_DIMENSIONS,
  COMPARISON_STATUS,
} from "../hooks/useCompetitiveLandscape";

/* ── Design tokens ───────────────────────────── */
const card = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-default)',
  backgroundColor: 'var(--color-bg-elevated)',
  padding: 'var(--space-6)',
  fontFamily: 'var(--font-sans)',
  boxShadow: 'var(--shadow-sm)',
};

const badge = (bg, fg) => ({
  display: "inline-flex", alignItems: "center",
  fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)',
  padding: "2px 8px", borderRadius: 'var(--radius-sm)',
  backgroundColor: bg, color: fg, lineHeight: "1.4",
  letterSpacing: 'var(--letter-spacing-wide)', textTransform: "uppercase",
});

const inputStyle = {
  width: "100%", fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-input-border)',
  backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)',
  fontFamily: 'var(--font-sans)', outline: "none", boxSizing: "border-box",
};

const btnPrimary = {
  fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)',
  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
  border: 'none', cursor: "pointer", fontFamily: 'var(--font-sans)',
  backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)',
};

const btnGhost = {
  ...btnPrimary,
  backgroundColor: 'var(--color-btn-ghost-bg)', color: 'var(--color-btn-ghost-text)',
};

const THREAT_BADGE = {
  High: { bg: "var(--color-badge-red-bg)", fg: "var(--color-badge-red-text)" },
  Medium: { bg: "var(--color-badge-amber-bg)", fg: "var(--color-badge-amber-text)" },
  Low: { bg: "var(--color-badge-green-bg)", fg: "var(--color-badge-green-text)" },
};

const TYPE_BADGE = {
  Direct: { bg: "var(--color-badge-red-bg)", fg: "var(--color-badge-red-text)" },
  Adjacent: { bg: "var(--color-badge-blue-bg)", fg: "var(--color-badge-blue-text)" },
  Emerging: { bg: "var(--color-badge-purple-bg)", fg: "var(--color-badge-purple-text)" },
};

/* ── Sub-views ──────────────────────────────── */
const VIEWS = [
  { id: "registry", label: "Registry" },
  { id: "matrix", label: "Comparison Matrix" },
  { id: "analysis", label: "Gap Analysis" },
];

/* ── Competitor Form ─────────────────────────── */
function CompetitorForm({ competitor, onSave, onCancel }) {
  const isEdit = !!competitor;
  const [form, setForm] = useState({
    name: competitor?.name || "",
    type: competitor?.type || "Direct",
    description: competitor?.description || "",
    threat_level: competitor?.threat_level || "Medium",
    key_differentiator: competitor?.key_differentiator || "",
    weakness: competitor?.weakness || "",
    website: competitor?.website || "",
    notes: competitor?.notes || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={card}>
      <h3 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
        {isEdit ? "Edit Competitor" : "Add Competitor"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Name *</label>
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Competitor name" />
        </div>
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Type</label>
          <select style={inputStyle} value={form.type} onChange={e => set("type", e.target.value)}>
            {COMPETITOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Threat Level</label>
          <select style={inputStyle} value={form.threat_level} onChange={e => set("threat_level", e.target.value)}>
            {THREAT_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Website</label>
          <input style={inputStyle} value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-3)' }}>
        <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Description</label>
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="What do they do?" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Key Differentiator</label>
          <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={form.key_differentiator} onChange={e => set("key_differentiator", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Weakness</label>
          <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={form.weakness} onChange={e => set("weakness", e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Notes</label>
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 'var(--space-2)' }}>
        <button style={btnPrimary} onClick={() => { if (form.name.trim()) onSave(form); }} disabled={!form.name.trim()}>
          {isEdit ? "Save Changes" : "Add Competitor"}
        </button>
        <button style={btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Matrix Cell Editor ──────────────────────── */
function MatrixCellEditor({ cell, onSave, onCancel }) {
  const [status, setStatus] = useState(cell.status || "unknown");
  const [notes, setNotes] = useState(cell.notes || "");

  return (
    <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-muted)' }}>
      <select style={{ ...inputStyle, marginBottom: 'var(--space-2)' }} value={status} onChange={e => setStatus(e.target.value)}>
        {Object.entries(COMPARISON_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <input style={{ ...inputStyle, marginBottom: 'var(--space-2)' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." />
      <div style={{ display: "flex", gap: 'var(--space-1)' }}>
        <button style={{ ...btnPrimary, padding: "4px 12px", fontSize: 11 }} onClick={() => onSave(status, notes)}>Save</button>
        <button style={{ ...btnGhost, padding: "4px 12px", fontSize: 11 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Analysis Editor ─────────────────────────── */
function AnalysisEditor({ analysis, onSave, onCancel }) {
  const [form, setForm] = useState({
    summary: analysis?.summary || "",
    strengths: (analysis?.strengths || []).join("\n"),
    weaknesses: (analysis?.weaknesses || []).join("\n"),
    opportunities: (analysis?.opportunities || []).join("\n"),
    threats: (analysis?.threats || []).join("\n"),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toArray = (s) => s.split("\n").map(l => l.trim()).filter(Boolean);

  return (
    <div style={card}>
      <h3 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
        Edit Competitive Analysis
      </h3>

      <div style={{ marginBottom: 'var(--space-3)' }}>
        <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>Summary</label>
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={form.summary} onChange={e => set("summary", e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        {[["strengths", "Strengths"], ["weaknesses", "Weaknesses"], ["opportunities", "Opportunities"], ["threats", "Threats"]].map(([key, label]) => (
          <div key={key}>
            <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', display: "block", marginBottom: 4 }}>{label} (one per line)</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={4} value={form[key]} onChange={e => set(key, e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 'var(--space-2)' }}>
        <button style={btnPrimary} onClick={() => onSave({
          summary: form.summary,
          strengths: toArray(form.strengths),
          weaknesses: toArray(form.weaknesses),
          opportunities: toArray(form.opportunities),
          threats: toArray(form.threats),
        })}>Save Analysis</button>
        <button style={btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Registry View ───────────────────────────── */
function RegistryView({ competitors, onAdd, onEdit, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);

  if (adding) return <CompetitorForm onSave={async (data) => { await onAdd(data); setAdding(false); }} onCancel={() => setAdding(false)} />;
  if (editing) return <CompetitorForm competitor={editing} onSave={async (data) => { await onEdit(editing.id, data); setEditing(null); }} onCancel={() => setEditing(null)} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--space-4)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          {competitors.length} competitor{competitors.length !== 1 ? "s" : ""} tracked
        </p>
        <button style={btnPrimary} onClick={() => setAdding(true)}>+ Add Competitor</button>
      </div>

      {competitors.map(c => {
        const tb = THREAT_BADGE[c.threat_level] || THREAT_BADGE.Medium;
        const typb = TYPE_BADGE[c.type] || TYPE_BADGE.Direct;
        const isExpanded = expanded === c.id;

        return (
          <div key={c.id} style={{ ...card, marginBottom: 'var(--space-3)', cursor: "pointer" }}
            onClick={() => setExpanded(isExpanded ? null : c.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: "wrap" }}>
                  <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>{c.name}</span>
                  <span style={badge(typb.bg, typb.fg)}>{c.type}</span>
                  <span style={badge(tb.bg, tb.fg)}>{c.threat_level} Threat</span>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>{c.description}</p>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', flexShrink: 0, marginLeft: 'var(--space-2)' }}>
                {isExpanded ? "\u25b2" : "\u25bc"}
              </span>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-default)', paddingTop: 'var(--space-4)' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', textTransform: "uppercase", marginBottom: 4 }}>Key Differentiator</div>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{c.key_differentiator || "Not set"}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', textTransform: "uppercase", marginBottom: 4 }}>Weakness</div>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{c.weakness || "Not set"}</p>
                  </div>
                </div>
                {c.notes && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{c.notes}</p>
                  </div>
                )}
                <div style={{ display: "flex", gap: 'var(--space-2)' }}>
                  <button style={btnGhost} onClick={() => setEditing(c)}>Edit</button>
                  <button style={{ ...btnGhost, color: 'var(--color-error)' }} onClick={async () => { if (confirm("Delete " + c.name + "?")) await onDelete(c.id); }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Matrix View ─────────────────────────────── */
function MatrixView({ competitors, matrix, onUpdateCell }) {
  const [editingCell, setEditingCell] = useState(null); // { compId, dimId }

  return (
    <div style={{ overflowX: "auto" }}>
      <p style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        Click any cell to set the comparison status and add notes.
      </p>

      <table style={{
        width: "100%", borderCollapse: "separate", borderSpacing: 0,
        fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-sans)',
        border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)',
        overflow: "hidden",
      }}>
        <thead>
          <tr>
            <th style={{
              textAlign: "left", padding: 'var(--space-3)', fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-bg-overlay)', borderBottom: '1px solid var(--color-border-default)',
              textTransform: "uppercase", letterSpacing: 'var(--letter-spacing-wider)',
              position: "sticky", left: 0, zIndex: 1, minWidth: 140,
            }}>
              Dimension
            </th>
            {competitors.map(c => (
              <th key={c.id} style={{
                textAlign: "center", padding: 'var(--space-3)', fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-bg-overlay)', borderBottom: '1px solid var(--color-border-default)',
                minWidth: 150,
              }}>
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_DIMENSIONS.map((dim, i) => (
            <tr key={dim.id}>
              <td style={{
                padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-elevated)',
                borderBottom: i < COMPARISON_DIMENSIONS.length - 1 ? '1px solid var(--color-border-default)' : 'none',
                position: "sticky", left: 0, zIndex: 1,
              }}>
                {dim.label}
              </td>
              {competitors.map(c => {
                const cell = (matrix[c.id] && matrix[c.id][dim.id]) || { status: "unknown", notes: "" };
                const st = COMPARISON_STATUS[cell.status] || COMPARISON_STATUS.unknown;
                const isEditing = editingCell?.compId === c.id && editingCell?.dimId === dim.id;

                return (
                  <td key={c.id} style={{
                    padding: 'var(--space-2)', textAlign: "center",
                    borderBottom: i < COMPARISON_DIMENSIONS.length - 1 ? '1px solid var(--color-border-default)' : 'none',
                    backgroundColor: 'var(--color-bg-elevated)',
                    cursor: isEditing ? "default" : "pointer",
                    verticalAlign: "top",
                  }}
                    onClick={() => { if (!isEditing) setEditingCell({ compId: c.id, dimId: dim.id }); }}
                  >
                    {isEditing ? (
                      <MatrixCellEditor
                        cell={cell}
                        onSave={async (status, notes) => { await onUpdateCell(c.id, dim.id, status, notes); setEditingCell(null); }}
                        onCancel={() => setEditingCell(null)}
                      />
                    ) : (
                      <div>
                        <span style={badge(
                          `var(--color-badge-${st.variant}-bg)`,
                          `var(--color-badge-${st.variant}-text)`
                        )}>{st.label}</span>
                        {cell.notes && (
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                            {cell.notes.length > 60 ? cell.notes.slice(0, 60) + "..." : cell.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Gap Analysis + SWOT View ────────────────── */
function AnalysisView({ analysis, gapAnalysis, onUpdateAnalysis }) {
  const [editing, setEditing] = useState(false);

  if (editing) return <AnalysisEditor analysis={analysis} onSave={async (data) => { await onUpdateAnalysis(data); setEditing(false); }} onCancel={() => setEditing(false)} />;

  const gaps = gapAnalysis.filter(g => g.status === "gap");
  const strengths = gapAnalysis.filter(g => g.status === "strong");

  return (
    <div>
      {/* Gap Analysis */}
      <div style={{ ...card, marginBottom: 'var(--space-4)' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Competitive Gap Analysis
          </h3>
        </div>

        {gaps.length > 0 && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-error)', textTransform: "uppercase", marginBottom: 'var(--space-2)' }}>
              Gaps ({gaps.length})
            </div>
            {gaps.map(g => (
              <div key={g.dimension.id} style={{
                padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-error-bg)', marginBottom: 'var(--space-2)',
                borderLeft: '3px solid var(--color-error)',
              }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>{g.dimension.label}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                  {g.disadvantageCount} disadvantage{g.disadvantageCount !== 1 ? "s" : ""} vs {g.advantageCount} advantage{g.advantageCount !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        {strengths.length > 0 && (
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-success)', textTransform: "uppercase", marginBottom: 'var(--space-2)' }}>
              Competitive Strengths ({strengths.length})
            </div>
            {strengths.map(g => (
              <div key={g.dimension.id} style={{
                padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-success-bg)', marginBottom: 'var(--space-2)',
                borderLeft: '3px solid var(--color-success)',
              }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>{g.dimension.label}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                  {g.advantageCount} advantage{g.advantageCount !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SWOT Analysis */}
      {analysis && (
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              Competitive Analysis (SWOT)
            </h3>
            <button style={btnGhost} onClick={() => setEditing(true)}>Refresh Analysis</button>
          </div>

          {analysis.summary && (
            <p style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
              {analysis.summary}
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 'var(--space-4)' }}>
            {[
              { key: "strengths", label: "Strengths", color: "var(--color-success)", bg: "var(--color-success-bg)" },
              { key: "weaknesses", label: "Weaknesses", color: "var(--color-error)", bg: "var(--color-error-bg)" },
              { key: "opportunities", label: "Opportunities", color: "var(--color-info)", bg: "var(--color-info-bg)" },
              { key: "threats", label: "Threats", color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
            ].map(({ key, label, color, bg }) => (
              <div key={key} style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: bg }}>
                <div style={{
                  fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)',
                  color, textTransform: "uppercase", letterSpacing: 'var(--letter-spacing-wider)',
                  marginBottom: 'var(--space-2)',
                }}>{label}</div>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', listStyle: "disc" }}>
                  {(analysis[key] || []).map((item, i) => (
                    <li key={i} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 4, lineHeight: 'var(--line-height-relaxed)' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {analysis.updated_at && (
            <p style={{ margin: 0, marginTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
              Last updated: {new Date(analysis.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {analysis.data_source ? ` \u00b7 Source: ${analysis.data_source}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════ */
export default function CompetitiveLandscapeTab() {
  const {
    competitors, matrix, analysis, gapAnalysis, loading,
    addCompetitor, updateCompetitor, deleteCompetitor,
    updateMatrixCell, updateAnalysis,
  } = useCompetitiveLandscape();
  const [view, setView] = useState("registry");

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: "center", color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Loading competitive landscape...</div>;
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--space-4)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', letterSpacing: 'var(--letter-spacing-tight)' }}>
          Competitive Landscape
        </h2>
      </div>

      {/* View tabs */}
      <div style={{ display: "flex", gap: 'var(--space-1)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border-default)', paddingBottom: 'var(--space-1)' }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)',
            fontWeight: view === v.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            color: view === v.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            backgroundColor: view === v.id ? 'var(--color-bg-overlay)' : 'transparent',
            border: 'none', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            cursor: "pointer", fontFamily: 'var(--font-sans)',
            borderBottom: view === v.id ? '2px solid var(--color-accent)' : '2px solid transparent',
          }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === "registry" && <RegistryView competitors={competitors} onAdd={addCompetitor} onEdit={updateCompetitor} onDelete={deleteCompetitor} />}
      {view === "matrix" && <MatrixView competitors={competitors} matrix={matrix} onUpdateCell={updateMatrixCell} />}
      {view === "analysis" && <AnalysisView analysis={analysis} gapAnalysis={gapAnalysis} onUpdateAnalysis={updateAnalysis} />}
    </div>
  );
}
