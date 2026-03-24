/**
 * GovernanceWidget — NIP Phase 6
 * Ben's Inbox: surfaces all pending decisions with one-click actions.
 * Tasks 6.3, 6.4, 6.6
 */
import { useState } from "react";
import {
  PRIORITY_ICONS,
  PRIORITY_COLORS,
  TYPE_LABELS,
  TYPE_COLORS,
  STATUS_LABELS,
} from "../../hooks/useGovernanceQueue";

/* ── Shared styles ───────────────────────────── */
const cardBase = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border-default)",
  backgroundColor: "var(--color-bg-elevated)",
  padding: "var(--space-4)",
  fontFamily: "var(--font-sans)",
};

const badgeStyle = (bg, fg = "#fff") => ({
  display: "inline-block",
  fontSize: "var(--font-size-xs)",
  fontWeight: "var(--font-weight-semibold)",
  padding: "2px 8px",
  borderRadius: "var(--radius-full)",
  backgroundColor: bg,
  color: fg,
  lineHeight: "1.4",
});

const btnBase = {
  fontSize: "var(--font-size-xs)",
  fontWeight: "var(--font-weight-semibold)",
  padding: "var(--space-1) var(--space-3)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-default)",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  transition: "all 0.15s ease",
};

/* ── Governance Queue Item Card ──────────────── */
function QueueItemCard({ item, onResolve, onExpand }) {
  const [showKillNotes, setShowKillNotes] = useState(false);
  const [killNotes, setKillNotes] = useState("");

  const priorityIcon = PRIORITY_ICONS[item.priority] || "\u26aa";
  const typeLabel = TYPE_LABELS[item.type] || item.type;
  const typeColor = TYPE_COLORS[item.type] || "#6b7280";
  const hasOptions = item.options && item.options.length > 0;

  return (
    <div style={{
      ...cardBase,
      borderLeft: `3px solid ${PRIORITY_COLORS[item.priority] || "#6b7280"}`,
      marginBottom: "var(--space-2)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
        {/* Priority icon */}
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{priorityIcon}</span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text-primary)",
            }}>
              {item.title}
            </span>
            <span style={badgeStyle(typeColor)}>{typeLabel}</span>
          </div>

          {/* Context line */}
          <p style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
            margin: 0,
            marginBottom: "var(--space-2)",
          }}>
            Source: {item.source}{hasOptions ? ` \u00b7 ${item.options.length} options` : ""}
            {item.related_collection ? ` \u00b7 \u2192 ${item.related_collection}` : ""}
          </p>

          {/* Kill notes input */}
          {showKillNotes && (
            <div style={{ marginBottom: "var(--space-2)" }}>
              <input
                type="text"
                placeholder="Reason for killing..."
                value={killNotes}
                onChange={e => setKillNotes(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "var(--font-size-xs)",
                  padding: "var(--space-1) var(--space-2)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-muted)",
                  backgroundColor: "var(--color-bg-overlay)",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                }}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") { onResolve(item.id, "killed", killNotes); setShowKillNotes(false); }
                  if (e.key === "Escape") setShowKillNotes(false);
                }}
              />
              <div style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-1)" }}>
                <button
                  style={{ ...btnBase, backgroundColor: "#ef4444", color: "#fff", border: "none" }}
                  onClick={() => { onResolve(item.id, "killed", killNotes); setShowKillNotes(false); }}
                >
                  Confirm Kill
                </button>
                <button
                  style={{ ...btnBase, backgroundColor: "var(--color-bg-overlay)", color: "var(--color-text-muted)" }}
                  onClick={() => setShowKillNotes(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!showKillNotes && (
            <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
              {item.type === "loop_output" ? (
                <button
                  style={{ ...btnBase, backgroundColor: "var(--color-bg-overlay)", color: "var(--color-text-primary)" }}
                  onClick={() => onResolve(item.id, "approved", "Acknowledged")}
                >
                  Acknowledge
                </button>
              ) : (
                <>
                  <button
                    style={{ ...btnBase, backgroundColor: "#22c55e", color: "#fff", border: "none" }}
                    onClick={() => onResolve(item.id, "approved", "Approved recommended action", hasOptions ? item.options[0]?.label : null)}
                  >
                    Approve
                  </button>
                  <button
                    style={{ ...btnBase, backgroundColor: "#ef4444", color: "#fff", border: "none" }}
                    onClick={() => setShowKillNotes(true)}
                  >
                    Kill
                  </button>
                  <button
                    style={{ ...btnBase, backgroundColor: "var(--color-bg-overlay)", color: "var(--color-text-primary)" }}
                    onClick={() => onResolve(item.id, "deferred")}
                  >
                    Defer
                  </button>
                </>
              )}
              <button
                style={{ ...btnBase, backgroundColor: "transparent", color: "var(--color-text-muted)", border: "none" }}
                onClick={() => onExpand(item)}
                title="Expand detail"
              >
                [\u2192]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Governance Item Detail View (Task 6.4) ──── */
function GovernanceDetail({ item, onResolve, onBack }) {
  const [selectedOption, setSelectedOption] = useState(
    item.options && item.options.length > 0 ? item.options[0].label : null
  );
  const [notes, setNotes] = useState(item.resolution_notes || "");
  const typeColor = TYPE_COLORS[item.type] || "#6b7280";

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 800 }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: "var(--space-4)",
          fontFamily: "var(--font-sans)",
        }}
      >
        \u2190 Back to Queue
      </button>

      <div style={cardBase}>
        {/* Header */}
        <h2 style={{
          fontSize: "var(--font-size-lg)",
          fontWeight: "var(--font-weight-bold)",
          color: "var(--color-text-primary)",
          margin: 0,
          marginBottom: "var(--space-2)",
        }}>
          {item.title}
        </h2>

        {/* Badges */}
        <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <span style={badgeStyle(typeColor)}>{TYPE_LABELS[item.type] || item.type}</span>
          <span style={badgeStyle(PRIORITY_COLORS[item.priority] || "#6b7280")}>{item.priority}</span>
          <span style={badgeStyle("var(--color-bg-overlay)", "var(--color-text-muted)")}>{item.source}</span>
          {item.status !== "pending" && (
            <span style={badgeStyle(item.status === "approved" ? "#22c55e" : item.status === "killed" ? "#ef4444" : "#6b7280")}>
              {STATUS_LABELS[item.status] || item.status}
            </span>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <h4 style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: "var(--space-1)" }}>
            Context
          </h4>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
            {item.description}
          </p>
        </div>

        {/* Recommended action */}
        <div style={{
          marginBottom: "var(--space-4)",
          padding: "var(--space-3)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--color-bg-overlay)",
          borderLeft: "3px solid #22c55e",
        }}>
          <h4 style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: "var(--space-1)" }}>
            Recommended Action
          </h4>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", margin: 0, lineHeight: 1.6 }}>
            {item.recommended_action}
          </p>
        </div>

        {/* Options (if any) */}
        {item.options && item.options.length > 0 && item.status === "pending" && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h4 style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: "var(--space-2)" }}>
              Options
            </h4>
            {item.options.map((opt, i) => (
              <label key={i} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-2)",
                padding: "var(--space-2)",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${selectedOption === opt.label ? "var(--color-accent)" : "var(--color-border-muted)"}`,
                backgroundColor: selectedOption === opt.label ? "var(--color-bg-overlay)" : "transparent",
                marginBottom: "var(--space-1)",
                cursor: "pointer",
              }}>
                <input
                  type="radio"
                  name="gov-option"
                  checked={selectedOption === opt.label}
                  onChange={() => setSelectedOption(opt.label)}
                  style={{ marginTop: 3, accentColor: "var(--color-accent)" }}
                />
                <div>
                  <div style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    {opt.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Resolution notes */}
        {item.status === "pending" && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h4 style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: "var(--space-1)" }}>
              Notes
            </h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add decision notes..."
              rows={3}
              style={{
                width: "100%",
                fontSize: "var(--font-size-sm)",
                padding: "var(--space-2)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-muted)",
                backgroundColor: "var(--color-bg-overlay)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-sans)",
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>
        )}

        {/* Resolved info */}
        {item.status !== "pending" && (
          <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-bg-overlay)" }}>
            <h4 style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", margin: 0, marginBottom: "var(--space-1)" }}>Resolution</h4>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", margin: 0 }}>
              <strong>{STATUS_LABELS[item.status]}</strong>
              {item.selected_option ? ` \u2014 ${item.selected_option}` : ""}
            </p>
            {item.resolution_notes && (
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: 0, marginTop: "var(--space-1)" }}>
                {item.resolution_notes}
              </p>
            )}
            {item.resolved_at && (
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-ghost)", margin: 0, marginTop: "var(--space-1)" }}>
                Resolved {new Date(item.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>
        )}

        {/* History */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-ghost)", margin: 0 }}>
            Created {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>

        {/* Action buttons (only for pending) */}
        {item.status === "pending" && (
          <div style={{ display: "flex", gap: "var(--space-2)", borderTop: "1px solid var(--color-border-muted)", paddingTop: "var(--space-3)" }}>
            <button
              style={{ ...btnBase, backgroundColor: "#22c55e", color: "#fff", border: "none", padding: "var(--space-2) var(--space-4)" }}
              onClick={() => { onResolve(item.id, "approved", notes || "Approved", selectedOption); onBack(); }}
            >
              Approve
            </button>
            <button
              style={{ ...btnBase, backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "var(--space-2) var(--space-4)" }}
              onClick={() => { onResolve(item.id, "killed", notes || "Killed"); onBack(); }}
            >
              Kill
            </button>
            <button
              style={{ ...btnBase, backgroundColor: "var(--color-bg-overlay)", color: "var(--color-text-primary)", padding: "var(--space-2) var(--space-4)" }}
              onClick={() => { onResolve(item.id, "deferred", notes); onBack(); }}
            >
              Defer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Resolved Items History (Task 6.6) ───────── */
function ResolvedHistory({ items }) {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = items.filter(i => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  const selectStyle = {
    fontSize: "var(--font-size-xs)",
    padding: "var(--space-1) var(--space-2)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-border-muted)",
    backgroundColor: "var(--color-bg-overlay)",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-sans)",
    outline: "none",
  };

  if (items.length === 0) {
    return (
      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-ghost)", textAlign: "center", padding: "var(--space-4)" }}>
        No resolved items yet
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="killed">Killed</option>
          <option value="modified">Modified</option>
          <option value="deferred">Deferred</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-ghost)", textAlign: "center" }}>No matching items</p>
      ) : (
        filtered.map(item => (
          <div key={item.id} style={{
            ...cardBase,
            marginBottom: "var(--space-2)",
            opacity: 0.8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)", flexWrap: "wrap" }}>
              <span style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text-secondary)",
              }}>
                {item.title}
              </span>
              <span style={badgeStyle(
                item.status === "approved" ? "#22c55e" :
                item.status === "killed" ? "#ef4444" :
                item.status === "deferred" ? "#eab308" : "#6b7280"
              )}>
                {STATUS_LABELS[item.status]}
              </span>
              <span style={badgeStyle(TYPE_COLORS[item.type] || "#6b7280")}>{TYPE_LABELS[item.type]}</span>
            </div>
            {item.selected_option && (
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: 0, marginBottom: 2 }}>
                Selected: {item.selected_option}
              </p>
            )}
            {item.resolution_notes && (
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: 0, marginBottom: 2 }}>
                {item.resolution_notes}
              </p>
            )}
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-ghost)", margin: 0 }}>
              {item.resolved_at ? new Date(item.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

/* ── Main Governance Section for Dashboard ───── */
export function GovernanceSection({ pendingItems, resolvedItems, onResolve, onExpand }) {
  const [showHistory, setShowHistory] = useState(false);
  const count = pendingItems.length;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <h3 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontFamily: "var(--font-sans)",
          }}>
            Governance Queue
          </h3>
          {count > 0 && (
            <span style={{
              ...badgeStyle("#ef4444"),
              fontSize: 11,
              padding: "1px 8px",
              fontWeight: 700,
            }}>
              {count}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-ghost)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontWeight: "var(--font-weight-medium)",
          }}
        >
          {showHistory ? "Show queue" : "History"}
        </button>
      </div>

      <div style={{ height: 1, backgroundColor: "var(--color-border-default)", marginBottom: "var(--space-3)" }} />

      {showHistory ? (
        <ResolvedHistory items={resolvedItems} />
      ) : count === 0 ? (
        /* Empty state */
        <div style={{
          ...cardBase,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-6)",
          border: "1px dashed var(--color-border-muted)",
          backgroundColor: "var(--color-bg-overlay)",
        }}>
          <span style={{ fontSize: 28, marginBottom: "var(--space-2)", opacity: 0.4 }}>{"\u2705"}</span>
          <p style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-muted)", margin: 0, marginBottom: 4 }}>
            All clear
          </p>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-ghost)", margin: 0 }}>
            No items pending governance
          </p>
        </div>
      ) : (
        /* Pending items */
        <div>
          {pendingItems.map(item => (
            <QueueItemCard
              key={item.id}
              item={item}
              onResolve={onResolve}
              onExpand={onExpand}
            />
          ))}

          {/* Deferred section */}
          {resolvedItems.filter(i => i.status === "deferred").length > 0 && (
            <div style={{ marginTop: "var(--space-3)" }}>
              <p style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-ghost)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-2)" }}>
                Deferred ({resolvedItems.filter(i => i.status === "deferred").length})
              </p>
              {resolvedItems.filter(i => i.status === "deferred").map(item => (
                <div key={item.id} style={{ ...cardBase, marginBottom: "var(--space-1)", opacity: 0.6, padding: "var(--space-2) var(--space-3)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Export detail view for App.jsx routing */
export { GovernanceDetail };
