/**
 * GovernanceWidget — NIP Phase 6 + Design Audit
 * Ben's Inbox: surfaces all pending decisions with one-click actions.
 * Redesigned per Nouvia Design Standard: typography roles, semantic colors, spacing grid.
 */
import { useState } from "react";
import {
  PRIORITY_ICONS,
  PRIORITY_COLORS,
  TYPE_LABELS,
  TYPE_COLORS,
  STATUS_LABELS,
} from "../../hooks/useGovernanceQueue";

/* ── Design tokens ───────────────────────────── */
const card = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-default)',
  backgroundColor: 'var(--color-bg-elevated)',
  padding: 'var(--space-6)',
  fontFamily: 'var(--font-sans)',
  boxShadow: 'var(--shadow-sm)',
};

const badge = (bg, fg = "#fff") => ({
  display: "inline-flex",
  alignItems: "center",
  fontSize: 'var(--font-size-xs)',
  fontWeight: 'var(--font-weight-semibold)',
  padding: "2px 8px",
  borderRadius: 'var(--radius-sm)',
  backgroundColor: bg,
  color: fg,
  lineHeight: "1.4",
  letterSpacing: 'var(--letter-spacing-wide)',
  textTransform: "uppercase",
});

const btn = {
  fontSize: 'var(--font-size-xs)',
  fontWeight: 'var(--font-weight-semibold)',
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  cursor: "pointer",
  fontFamily: 'var(--font-sans)',
  transition: "all var(--duration-base) var(--ease-default)",
  letterSpacing: 'var(--letter-spacing-wide)',
};

/* ── Governance Queue Item Card (CHANGE 4) ───── */
function QueueItemCard({ item, onResolve, onExpand }) {
  const [showKillNotes, setShowKillNotes] = useState(false);
  const [killNotes, setKillNotes] = useState("");

  const priorityIcon = PRIORITY_ICONS[item.priority] || "\u26aa";
  const priorityLabel = (item.priority || "").toUpperCase();
  const typeLabel = TYPE_LABELS[item.type] || item.type;
  const typeColor = TYPE_COLORS[item.type] || "var(--color-text-muted)";
  const hasOptions = item.options && item.options.length > 0;
  const createdDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <div style={{
      ...card,
      borderLeft: `3px solid ${PRIORITY_COLORS[item.priority] || "var(--color-border-default)"}`,
      marginBottom: 'var(--space-4)',
    }}>
      {/* Priority + Status row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--space-3)' }}>
        <div style={{ display: "flex", alignItems: "center", gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 14 }}>{priorityIcon}</span>
          <span style={badge(PRIORITY_COLORS[item.priority] || "var(--color-text-muted)")}>{priorityLabel}</span>
          <span style={badge(typeColor)}>{typeLabel}</span>
        </div>
        <span style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-muted)',
          textTransform: "uppercase",
          letterSpacing: 'var(--letter-spacing-wider)',
        }}>
          Pending
        </span>
      </div>

      {/* Title — Title role (16-17px, Semibold) */}
      <h4 style={{
        margin: 0,
        fontSize: 'var(--font-size-md)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--space-1)',
        lineHeight: 'var(--line-height-snug)',
      }}>
        {item.title}
      </h4>

      {/* Goal linkage — Label role */}
      {item.goal_title && (
        <p style={{
          margin: 0,
          marginBottom: 'var(--space-3)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-warning)',
        }}>
          Goal: {item.goal_title}
        </p>
      )}

      {/* Description — Body role (14-15px, Regular) */}
      <p style={{
        margin: 0,
        marginBottom: 'var(--space-3)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--line-height-relaxed)',
      }}>
        {item.description}
      </p>

      {/* Recommended action — Body role, Semibold */}
      <div style={{
        marginBottom: 'var(--space-3)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--color-bg-overlay)',
        borderLeft: '3px solid var(--color-success)',
      }}>
        <p style={{
          margin: 0,
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--line-height-relaxed)',
        }}>
          {"\u25b8"} Recommended: {item.recommended_action}
        </p>
      </div>

      {/* Source + date — Label role */}
      <p style={{
        margin: 0,
        marginBottom: 'var(--space-3)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-muted)',
      }}>
        Source: {item.source}{hasOptions ? ` \u00b7 ${item.options.length} options` : ""} \u00b7 Created: {createdDate}
      </p>

      {/* Kill notes */}
      {showKillNotes && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <input
            type="text"
            placeholder="Reason for killing..."
            value={killNotes}
            onChange={e => setKillNotes(e.target.value)}
            style={{
              width: "100%",
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-input-border)',
              backgroundColor: 'var(--color-input-bg)',
              color: 'var(--color-input-text)',
              fontFamily: 'var(--font-sans)',
              outline: "none",
            }}
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") { onResolve(item.id, "killed", killNotes); setShowKillNotes(false); }
              if (e.key === "Escape") setShowKillNotes(false);
            }}
          />
          <div style={{ display: "flex", gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <button style={{ ...btn, backgroundColor: "var(--color-error)", color: "#fff" }}
              onClick={() => { onResolve(item.id, "killed", killNotes); setShowKillNotes(false); }}>
              Confirm Kill
            </button>
            <button style={{ ...btn, backgroundColor: "var(--color-bg-overlay)", color: "var(--color-text-muted)" }}
              onClick={() => setShowKillNotes(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showKillNotes && (
        <div style={{ display: "flex", gap: 'var(--space-2)', alignItems: "center" }}>
          {item.type === "loop_output" ? (
            <button style={{ ...btn, backgroundColor: "var(--color-bg-overlay)", color: "var(--color-text-primary)" }}
              onClick={() => onResolve(item.id, "approved", "Acknowledged")}>
              Acknowledge
            </button>
          ) : (
            <>
              <button style={{ ...btn, backgroundColor: "var(--color-info)", color: "#fff" }}
                onClick={() => onResolve(item.id, "approved", "Approved recommended action", hasOptions ? item.options[0]?.label : null)}>
                Approve
              </button>
              <button style={{ ...btn, backgroundColor: "transparent", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
                onClick={() => setShowKillNotes(true)}>
                Kill
              </button>
              <button style={{ ...btn, backgroundColor: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border-strong)" }}
                onClick={() => onResolve(item.id, "deferred")}>
                Defer
              </button>
            </>
          )}
          <button style={{ ...btn, backgroundColor: "transparent", color: "var(--color-text-muted)", border: "none", padding: "var(--space-1) var(--space-2)" }}
            onClick={() => onExpand(item)} title="View details">
            Details {"\u2192"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Governance Item Detail View ─────────────── */
function GovernanceDetail({ item, onResolve, onBack }) {
  const [selectedOption, setSelectedOption] = useState(
    item.options && item.options.length > 0 ? item.options[0].label : null
  );
  const [notes, setNotes] = useState(item.resolution_notes || "");
  const typeColor = TYPE_COLORS[item.type] || "var(--color-text-muted)";

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 800 }}>
      <button onClick={onBack} style={{
        fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)',
        background: "none", border: "none", cursor: "pointer", padding: 0,
        marginBottom: 'var(--space-4)', fontFamily: 'var(--font-sans)',
      }}>
        {"\u2190"} Back to Queue
      </button>

      <div style={card}>
        {/* Title */}
        <h2 style={{
          fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)', margin: 0, marginBottom: 'var(--space-2)',
          lineHeight: 'var(--line-height-snug)',
        }}>
          {item.title}
        </h2>

        {/* Goal linkage */}
        {item.goal_title && (
          <p style={{ margin: 0, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)', color: 'var(--color-warning)' }}>
            Goal: {item.goal_title}
          </p>
        )}

        {/* Badges */}
        <div style={{ display: "flex", gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: "wrap" }}>
          <span style={badge(typeColor)}>{TYPE_LABELS[item.type] || item.type}</span>
          <span style={badge(PRIORITY_COLORS[item.priority] || "var(--color-text-muted)")}>{item.priority}</span>
          <span style={badge("var(--color-bg-overlay)", "var(--color-text-muted)")}>{item.source}</span>
          {item.status !== "pending" && (
            <span style={badge(item.status === "approved" ? "var(--color-success)" : item.status === "killed" ? "var(--color-error)" : "var(--color-text-muted)")}>
              {STATUS_LABELS[item.status]}
            </span>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', textTransform: "uppercase", letterSpacing: 'var(--letter-spacing-wider)', margin: 0, marginBottom: 'var(--space-1)' }}>
            Context
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 'var(--line-height-relaxed)' }}>
            {item.description}
          </p>
        </div>

        {/* Recommended action */}
        <div style={{
          marginBottom: 'var(--space-4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-bg-overlay)', borderLeft: '3px solid var(--color-success)',
        }}>
          <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-success)', textTransform: "uppercase", letterSpacing: 'var(--letter-spacing-wider)', margin: 0, marginBottom: 'var(--space-1)' }}>
            Recommended Action
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', margin: 0, lineHeight: 'var(--line-height-relaxed)' }}>
            {item.recommended_action}
          </p>
        </div>

        {/* Options */}
        {item.options && item.options.length > 0 && item.status === "pending" && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', textTransform: "uppercase", letterSpacing: 'var(--letter-spacing-wider)', margin: 0, marginBottom: 'var(--space-2)' }}>
              Options
            </h4>
            {item.options.map((opt, i) => (
              <label key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 'var(--space-2)',
                padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                border: `1px solid ${selectedOption === opt.label ? "var(--color-accent)" : "var(--color-border-muted)"}`,
                backgroundColor: selectedOption === opt.label ? "var(--color-accent-subtle)" : "transparent",
                marginBottom: 'var(--space-2)', cursor: "pointer",
              }}>
                <input type="radio" name="gov-option" checked={selectedOption === opt.label}
                  onChange={() => setSelectedOption(opt.label)}
                  style={{ marginTop: 3, accentColor: "var(--color-accent)" }} />
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>{opt.label}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{opt.description}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Resolution notes */}
        {item.status === "pending" && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', textTransform: "uppercase", letterSpacing: 'var(--letter-spacing-wider)', margin: 0, marginBottom: 'var(--space-1)' }}>
              Notes
            </h4>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add decision notes..." rows={3}
              style={{
                width: "100%", fontSize: 'var(--font-size-sm)', padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-input-border)',
                backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)',
                fontFamily: 'var(--font-sans)', resize: "vertical", outline: "none",
              }} />
          </div>
        )}

        {/* Resolved info */}
        {item.status !== "pending" && (
          <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-overlay)' }}>
            <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', textTransform: "uppercase", margin: 0, marginBottom: 'var(--space-1)' }}>Resolution</h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', margin: 0 }}>
              <strong>{STATUS_LABELS[item.status]}</strong>
              {item.selected_option ? ` \u2014 ${item.selected_option}` : ""}
            </p>
            {item.resolution_notes && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0, marginTop: 'var(--space-1)' }}>{item.resolution_notes}</p>
            )}
            {item.resolved_at && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', margin: 0, marginTop: 'var(--space-1)' }}>
                Resolved {new Date(item.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>
        )}

        {/* History */}
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', margin: 0, marginBottom: 'var(--space-4)' }}>
          Created {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>

        {/* Actions */}
        {item.status === "pending" && (
          <div style={{ display: "flex", gap: 'var(--space-2)', borderTop: '1px solid var(--color-border-default)', paddingTop: 'var(--space-4)' }}>
            <button style={{ ...btn, backgroundColor: "var(--color-info)", color: "#fff", padding: "var(--space-2) var(--space-5)" }}
              onClick={() => { onResolve(item.id, "approved", notes || "Approved", selectedOption); onBack(); }}>Approve</button>
            <button style={{ ...btn, backgroundColor: "transparent", color: "var(--color-error)", border: "1px solid var(--color-error)", padding: "var(--space-2) var(--space-5)" }}
              onClick={() => { onResolve(item.id, "killed", notes || "Killed"); onBack(); }}>Kill</button>
            <button style={{ ...btn, backgroundColor: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border-strong)", padding: "var(--space-2) var(--space-5)" }}
              onClick={() => { onResolve(item.id, "deferred", notes); onBack(); }}>Defer</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Resolved Items History ──────────────────── */
function ResolvedHistory({ items }) {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = items.filter(i => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  const sel = {
    fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-input-border)',
    backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)',
    fontFamily: 'var(--font-sans)', outline: "none",
  };

  if (items.length === 0) {
    return <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-subtle)', textAlign: "center", padding: 'var(--space-6)' }}>No resolved items yet</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <select style={sel} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select style={sel} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="killed">Killed</option>
          <option value="modified">Modified</option>
          <option value="deferred">Deferred</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', textAlign: "center" }}>No matching items</p>
      ) : (
        filtered.map(item => (
          <div key={item.id} style={{ ...card, marginBottom: 'var(--space-2)', opacity: 0.8, padding: 'var(--space-4)' }}>
            <div style={{ display: "flex", alignItems: "center", gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: "wrap" }}>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>{item.title}</span>
              <span style={badge(
                item.status === "approved" ? "var(--color-success)" :
                item.status === "killed" ? "var(--color-error)" :
                item.status === "deferred" ? "var(--color-warning)" : "var(--color-text-muted)"
              )}>{STATUS_LABELS[item.status]}</span>
              <span style={badge(TYPE_COLORS[item.type] || "var(--color-text-muted)")}>{TYPE_LABELS[item.type]}</span>
            </div>
            {item.selected_option && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0, marginBottom: 2 }}>Selected: {item.selected_option}</p>
            )}
            {item.resolution_notes && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0, marginBottom: 2 }}>{item.resolution_notes}</p>
            )}
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', margin: 0 }}>
              {item.resolved_at ? new Date(item.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

/* ── Main Governance Section ─────────────────── */
export function GovernanceSection({ pendingItems, resolvedItems, onResolve, onExpand }) {
  const [showHistory, setShowHistory] = useState(false);
  const count = pendingItems.length;

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header — Headline role */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 'var(--space-4)' }}>
        <div style={{ display: "flex", alignItems: "center", gap: 'var(--space-3)' }}>
          <h2 style={{
            margin: 0,
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--letter-spacing-tight)',
          }}>
            Governance Queue
          </h2>
          {count > 0 && (
            <span style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-bold)',
              color: '#fff',
              backgroundColor: 'var(--color-error)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 10px',
              lineHeight: '1.4',
            }}>
              {count} pending
            </span>
          )}
        </div>
        <button onClick={() => setShowHistory(!showHistory)} style={{
          fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-muted)', background: "none", border: "none",
          cursor: "pointer", fontFamily: 'var(--font-sans)',
        }}>
          {showHistory ? "Show queue" : "History"}
        </button>
      </div>

      <div style={{ height: 1, backgroundColor: 'var(--color-border-default)', marginBottom: 'var(--space-4)' }} />

      {showHistory ? (
        <ResolvedHistory items={resolvedItems} />
      ) : count === 0 ? (
        <div style={{
          ...card,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 'var(--space-8)',
          border: '1px dashed var(--color-border-muted)', backgroundColor: 'var(--color-bg-overlay)',
        }}>
          <span style={{ fontSize: 32, marginBottom: 'var(--space-2)', opacity: 0.4 }}>{"\u2705"}</span>
          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', margin: 0, marginBottom: 'var(--space-1)' }}>
            All clear
          </p>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', margin: 0 }}>
            No items pending governance
          </p>
        </div>
      ) : (
        <div>
          {pendingItems.map(item => (
            <QueueItemCard key={item.id} item={item} onResolve={onResolve} onExpand={onExpand} />
          ))}
        </div>
      )}
    </div>
  );
}

export { GovernanceDetail };
