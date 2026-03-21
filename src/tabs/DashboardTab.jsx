/**
 * DashboardTab — INT-001 TASK-16 (WS2)
 * 12-column CSS Grid at 1440px (--layout-max-canvas).
 * Row 1: MRRWidget(4) + OKRWidget(4) + ExperimentsWidget(2) + CapabilityGapWidget(2)
 * Row 2: PriorityQueueWidget(12)
 * Row 3: Existing stat cards + canvas mini-map + active experiments + recent notes (preserved)
 */
import MRRWidget           from '../components/widgets/MRRWidget';
import OKRWidget           from '../components/widgets/OKRWidget';
import ExperimentsWidget   from '../components/widgets/ExperimentsWidget';
import CapabilityGapWidget from '../components/widgets/CapabilityGapWidget';
import PriorityQueueWidget from '../components/widgets/PriorityQueueWidget';

const BMC_BLOCKS = [
  { id: "key_partners",          short: "KP" },
  { id: "key_activities",        short: "KA" },
  { id: "key_resources",         short: "KR" },
  { id: "value_propositions",    short: "VP" },
  { id: "customer_relationships",short: "CR" },
  { id: "channels",              short: "CH" },
  { id: "customer_segments",     short: "CS" },
  { id: "cost_structure",        short: "CO" },
  { id: "revenue_streams",       short: "RS" },
];

const STATUS_BV = (s) => ({
  Hypothesis: "default", Testing: "blue", Validated: "green", Invalidated: "red", Pivoted: "amber",
}[s] || "default");

const STAGE_BV = (s) => ({
  Innovator: "purple", "Early Adopter": "blue", Chasm: "red", "Early Majority": "green", "Late Majority": "amber",
}[s] || "default");

function LocalBadge({ children, variant = "gray" }) {
  const VARIANTS = {
    gray:   { bg: "var(--color-badge-gray-bg)",   text: "var(--color-badge-gray-text)"   },
    green:  { bg: "var(--color-badge-green-bg)",  text: "var(--color-badge-green-text)"  },
    amber:  { bg: "var(--color-badge-amber-bg)",  text: "var(--color-badge-amber-text)"  },
    red:    { bg: "var(--color-badge-red-bg)",    text: "var(--color-badge-red-text)"    },
    blue:   { bg: "var(--color-badge-blue-bg)",   text: "var(--color-badge-blue-text)"   },
    purple: { bg: "var(--color-badge-purple-bg)", text: "var(--color-badge-purple-text)" },
    cyan:   { bg: "var(--color-badge-cyan-bg)",   text: "var(--color-badge-cyan-text)"   },
    default:{ bg: "var(--color-badge-gray-bg)",   text: "var(--color-badge-gray-text)"   },
  };
  const v = VARIANTS[variant] || VARIANTS.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      backgroundColor: v.bg, color: v.text,
      fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)',
      padding: '2px var(--space-2)', borderRadius: 'var(--radius-full)',
      fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardTab({
  clients     = [],
  experiments = [],
  canvas      = {},
  coworkers   = [],
  skills      = [],
  connectors  = [],
  setTab,
}) {
  const activeExp   = experiments.filter(e => e.status === 'Testing' || e.status === 'Hypothesis');
  const canvasItems = Object.values(canvas).reduce((s, a) => s + (a || []).length, 0);
  const filledBlocks = BMC_BLOCKS.filter(b => (canvas[b.id] || []).length > 0).length;
  const gaps        = coworkers.filter(c => c.status === 'Gap').length;
  const skillGaps   = skills.filter(sk => sk.status === 'Gap').length;
  const connIssues  = connectors.filter(c => c.status === 'Degraded' || c.status === 'Offline').length;
  const allNotes    = clients.flatMap(c => (c.entries || []).map(n => ({ ...n, clientName: c.name })));
  const recentNotes = [...allNotes].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  /* ── widget grid ─────────────────────────────────────────────── */
  const grid = {
    display:             'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap:                 'var(--space-4)',
    marginBottom:        'var(--space-6)',
  };

  const col4 = { gridColumn: 'span 4' };
  const col3 = { gridColumn: 'span 3' };
  const col2 = { gridColumn: 'span 2' };
  const col12 = { gridColumn: 'span 12' };

  /* ── section heading ─────────────────────────────────────────── */
  const sectionHead = {
    fontSize:      'var(--font-size-xs)',
    fontWeight:    'var(--font-weight-semibold)',
    color:         'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--letter-spacing-widest)',
    fontFamily:    'var(--font-sans)',
    marginBottom:  'var(--space-3)',
  };

  const divider = {
    height:          '1px',
    backgroundColor: 'var(--color-border-default)',
    margin:          'var(--space-6) 0',
  };

  const card = {
    backgroundColor: 'var(--color-bg-elevated)',
    border:          '1px solid var(--color-border-default)',
    borderRadius:    'var(--radius-lg)',
    padding:         'var(--space-4)',
  };

  const subText = {
    fontSize:   'var(--font-size-xs)',
    color:      'var(--color-text-subtle)',
    fontFamily: 'var(--font-sans)',
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)', letterSpacing: 'var(--letter-spacing-tight)' }}>
          Strategy Dashboard
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-subtle)' }}>
          Your living strategic operating system
        </p>
      </div>

      {/* ── Row 1: MRR(4) + OKR(4) + Experiments(2) + CapabilityGaps(2) ── */}
      <div style={grid}>
        <div style={col4}><MRRWidget /></div>
        <div style={col4}><OKRWidget /></div>
        <div style={col2}><ExperimentsWidget experiments={experiments} onNavigate={() => setTab?.('experiments')} /></div>
        <div style={col2}><CapabilityGapWidget /></div>
      </div>

      {/* ── Row 2: Priority Queue (12) ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <PriorityQueueWidget />
      </div>

      {/* ── Row 3: Existing content ── */}
      <div style={divider} />

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Clients',     value: clients.length,     icon: '◉', tab: 'clients',     sub: null },
          { label: 'Canvas',      value: canvasItems,        icon: '▣', tab: 'canvas',      sub: `${filledBlocks}/9 blocks` },
          { label: 'Experiments', value: experiments.length, icon: '△', tab: 'experiments', sub: null },
          { label: 'Coworkers',   value: coworkers.length,   icon: '⚙', tab: 'coworkers',   sub: gaps > 0 ? `${gaps} gaps` : null },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setTab?.(s.tab)}
            className="rounded-xl p-4 text-center border border-[var(--color-border-default)] hover:border-[var(--color-border-muted)] transition-all group"
            style={{ backgroundColor: 'var(--color-bg-elevated)' }}
          >
            <div className="text-lg text-[var(--color-text-subtle)] mb-1.5 group-hover:scale-110 transition-transform">{s.icon}</div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">{s.value}</div>
            <div className="text-xs text-[var(--color-text-subtle)] mt-0.5 font-medium">{s.label}</div>
            {s.sub && <div className="text-xs text-amber-500/70 mt-1">{s.sub}</div>}
          </button>
        ))}
      </div>

      {/* Infrastructure */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Skills',     value: skills.length,     sub: skillGaps  > 0 ? `${skillGaps} gaps`    : 'all good', icon: '◈', tab: 'coworkers', warn: skillGaps  > 0 },
          { label: 'Connectors', value: connectors.length, sub: connIssues > 0 ? `${connIssues} issues` : 'all green', icon: '⟳', tab: 'coworkers', warn: connIssues > 0 },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setTab?.(s.tab)}
            className="rounded-xl p-3 text-center border border-[var(--color-border-default)] hover:border-[var(--color-border-muted)] transition-all group flex items-center gap-3 px-4"
            style={{ backgroundColor: 'var(--color-bg-elevated)' }}
          >
            <div className="text-xl text-[var(--color-text-subtle)] group-hover:scale-110 transition-transform">{s.icon}</div>
            <div className="text-left">
              <div className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums leading-tight">
                {s.value} <span className="text-sm font-medium text-[var(--color-text-muted)]">{s.label}</span>
              </div>
              <div className={`text-xs mt-0.5 ${s.warn ? 'text-amber-500/70' : 'text-[var(--color-text-ghost)]'}`}>{s.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Canvas mini-map */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">Business Model Canvas</h3>
          <button onClick={() => setTab?.('canvas')} className="text-xs text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] font-medium">Open canvas →</button>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {BMC_BLOCKS.slice(0, 7).map(b => (
            <div key={b.id} className="p-1.5 rounded text-center border"
              style={{ backgroundColor: (canvas[b.id] || []).length > 0 ? 'var(--color-bg-overlay)' : 'var(--color-bg-elevated)', borderColor: (canvas[b.id] || []).length > 0 ? 'var(--color-border-muted)' : 'var(--color-border-default)' }}>
              <div className="text-xs font-bold text-[var(--color-text-subtle)]">{b.short}</div>
              <div className={`text-lg font-bold ${(canvas[b.id] || []).length > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-ghost)]'}`}>{(canvas[b.id] || []).length}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {BMC_BLOCKS.slice(7).map(b => (
            <div key={b.id} className="p-1.5 rounded text-center border"
              style={{ backgroundColor: (canvas[b.id] || []).length > 0 ? 'var(--color-bg-overlay)' : 'var(--color-bg-elevated)', borderColor: (canvas[b.id] || []).length > 0 ? 'var(--color-border-muted)' : 'var(--color-border-default)' }}>
              <div className="text-xs font-bold text-[var(--color-text-subtle)]">{b.short}</div>
              <div className={`text-lg font-bold ${(canvas[b.id] || []).length > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-ghost)]'}`}>{(canvas[b.id] || []).length}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active experiments */}
      {activeExp.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">Active Experiments</h3>
            <button onClick={() => setTab?.('experiments')} className="text-xs text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] font-medium">View all →</button>
          </div>
          <div className="space-y-2">
            {activeExp.slice(0, 3).map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border-default)]" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                <p className="text-sm text-[var(--color-text-secondary)] truncate flex-1 pr-3">{e.hypothesis}</p>
                <LocalBadge variant={STATUS_BV(e.status)}>{e.status}</LocalBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent client notes */}
      {recentNotes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">Recent Client Notes</h3>
            <button onClick={() => setTab?.('clients')} className="text-xs text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] font-medium">View all →</button>
          </div>
          <div className="space-y-2">
            {recentNotes.map((n, i) => (
              <div key={i} className="p-3 rounded-lg border border-[var(--color-border-default)]" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">{n.clientName}</span>
                  <span className="text-xs text-[var(--color-text-ghost)]">{formatDate(n.date)}</span>
                </div>
                <p className="text-sm text-[var(--color-text-subtle)] truncate">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {clients.length === 0 && experiments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-text-subtle)]">Start by filling in the Business Model Canvas and registering your coworkers.</p>
        </div>
      )}
    </div>
  );
}
