/**
 * IPLibraryTab — INT-001 TASK-09 (NCC-006)
 * IP Library tab: real-time NCC / reusable-pattern tracker.
 * Uses useIPLibrary hook + NCCCard + NCCModal.
 */

import { useState } from 'react';
import { useIPLibrary } from '../hooks/useIPLibrary';
import NCCCard from '../components/ui/NCCCard';
import NCCModal from '../components/ui/NCCModal';

const FILTER_OPTS = ["All", "Component", "Pattern", "Hook", "System"];
const STATUS_OPTS = ["All", "Candidate", "Proposed", "Active", "Deprecated"];

function EmptyState() {
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      justifyContent:"center",
      padding:       "var(--space-12) 0",
      color:         "var(--color-text-subtle)",
      fontFamily:    "var(--font-sans)",
    }}>
      <div style={{ fontSize: "2rem", opacity: 0.35, marginBottom: "var(--space-2)" }}>◎</div>
      <p style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-muted)", margin: 0 }}>No entries yet</p>
      <p style={{ fontSize: "var(--font-size-xs)", marginTop: "var(--space-1)", margin: 0 }}>Add your first reusable component or pattern</p>
    </div>
  );
}

export default function IPLibraryTab() {
  const { items, loading, error, addItem, updateItem, removeItem } = useIPLibrary();
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [statusFilter,setStatusFilter]= useState("All");

  const handleSave = async (data) => {
    if (editTarget) {
      await updateItem(editTarget.id, data);
    } else {
      await addItem(data);
    }
    setEditTarget(null);
  };

  const handleEdit = (item) => {
    setEditTarget(item);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const filtered = items.filter(item => {
    if (typeFilter   !== "All" && item.type   !== typeFilter)   return false;
    if (statusFilter !== "All" && item.status !== statusFilter) return false;
    return true;
  });

  const active     = items.filter(i => i.status === "Active").length;
  const candidates = items.filter(i => i.status === "Candidate" || i.status === "Proposed").length;

  const filterBtn = (value, current, setter) => ({
    padding:         "var(--space-1) var(--space-3)",
    fontSize:        "var(--font-size-xs)",
    fontWeight:      "var(--font-weight-medium)",
    fontFamily:      "var(--font-sans)",
    border:          "1px solid var(--color-border-default)",
    borderRadius:    "var(--radius-full)",
    cursor:          "pointer",
    backgroundColor: value === current ? "var(--color-bg-overlay)"  : "transparent",
    color:           value === current ? "var(--color-text-primary)" : "var(--color-text-muted)",
    transition:      `all var(--duration-base) var(--ease-default)`,
  });

  const primaryBtn = {
    display:         "inline-flex",
    alignItems:      "center",
    justifyContent:  "center",
    minHeight:       "var(--layout-tap-min)",
    padding:         "0 var(--space-4)",
    borderRadius:    "var(--radius-md)",
    fontSize:        "var(--font-size-xs)",
    fontWeight:      "var(--font-weight-medium)",
    fontFamily:      "var(--font-sans)",
    backgroundColor: "var(--color-btn-primary-bg)",
    color:           "var(--color-btn-primary-text)",
    border:          "none",
    cursor:          "pointer",
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
        <div>
          <h2 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", margin: 0 }}>
            IP Library
          </h2>
          {items.length > 0 && (
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-ghost)", marginTop: "var(--space-1)", marginBottom: 0 }}>
              {items.length} entries · {active} active · {candidates} candidates
            </p>
          )}
        </div>
        <button style={primaryBtn} onClick={handleAdd}>+ Add Entry</button>
      </div>

      {/* Filters */}
      {items.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
            {FILTER_OPTS.map(v => (
              <button key={v} style={filterBtn(v, typeFilter, setTypeFilter)} onClick={() => setTypeFilter(v)}>{v}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
            {STATUS_OPTS.map(v => (
              <button key={v} style={filterBtn(v, statusFilter, setStatusFilter)} onClick={() => setStatusFilter(v)}>{v}</button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading && (
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-subtle)", textAlign: "center", padding: "var(--space-8) 0" }}>Loading…</p>
      )}
      {error && (
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-badge-red-text)", textAlign: "center", padding: "var(--space-8) 0" }}>
          Error: {error}
        </p>
      )}
      {!loading && !error && items.length === 0 && <EmptyState />}
      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-subtle)", textAlign: "center", padding: "var(--space-8) 0" }}>No entries match the current filters.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {filtered.map(item => (
          <NCCCard key={item.id} item={item} onEdit={handleEdit} onRemove={removeItem} />
        ))}
      </div>

      {/* Modal */}
      <NCCModal
        open={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editTarget}
      />
    </div>
  );
}
