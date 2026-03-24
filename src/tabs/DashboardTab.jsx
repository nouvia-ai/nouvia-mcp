/**
 * DashboardTab — NIP Phase 6 + Design Audit
 * Two modes:
 *   mode="governance" — Governance Queue (Ben's Inbox, action-focused)
 *   mode="overview"   — Cockpit (read-only intelligence overview)
 */
import NorthStarGoal      from '../components/Cockpit/MeasureSection/NorthStarGoal';
import FinancialMetrics   from '../components/Cockpit/MeasureSection/FinancialMetrics';
import BacklogPipeline    from '../components/Cockpit/MeasureSection/BacklogPipeline';
import OKRProgress        from '../components/Cockpit/BuildSection/OKRProgress';
import PrioritySequence   from '../components/Cockpit/BuildSection/PrioritySequence';
import WeeklyTodos        from '../components/Cockpit/BuildSection/WeeklyTodos';
import KeyFindings        from '../components/Cockpit/LearnSection/KeyFindings';
import ExperimentSummary  from '../components/Cockpit/LearnSection/ExperimentSummary';
import FlywheelConnection from '../components/Cockpit/LearnSection/FlywheelConnection';
import { NASSection }     from '../components/NAS/NASWidget';
import { RiskSignalsSection } from '../components/Risk/RiskWidget';
import { ChannelsSection } from '../components/Channels/ChannelsWidget';
import { GovernanceSection } from '../components/Governance/GovernanceWidget';

/* ── Design tokens (Nouvia Design Standard) ──── */
const SECTION_GAP  = 'var(--space-8)';   /* 32px between sections */
const WIDGET_GAP   = 'var(--space-4)';   /* 16px between cards */
const COL_GAP      = 'var(--space-4)';   /* 16px between columns */

/* ── Section header — Headline role (20-22px) ── */
function SectionHeader({ label, sub }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <h3 style={{
          margin: 0,
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-sans)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}>
          {label}
        </h3>
        {sub && (
          <span style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
          }}>
            {sub}
          </span>
        )}
      </div>
      <div style={{ height: 1, backgroundColor: 'var(--color-border-default)', marginTop: 'var(--space-2)' }} />
    </div>
  );
}

/* ── Widget card wrapper ───────────────────────── */
function WidgetCard({ children, flex }) {
  return (
    <div style={{ flex: flex || 1, minWidth: 0 }}>
      {children}
    </div>
  );
}

/* ── Widget label — Label role (12-13px) ──────── */
function WidgetLabel({ children }) {
  return (
    <div style={{
      fontSize: 'var(--font-size-xs)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--letter-spacing-wider)',
      marginBottom: 'var(--space-2)',
      fontFamily: 'var(--font-sans)',
    }}>
      {children}
    </div>
  );
}

/* ── Placeholder card ──────────────────────────── */
function PlaceholderCard({ icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      borderRadius: 'var(--radius-md)',
      border: '1px dashed var(--color-border-muted)',
      backgroundColor: 'var(--color-bg-overlay)',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 28, marginBottom: 'var(--space-2)', opacity: 0.4 }}>{icon}</div>
      <p style={{
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-text-muted)',
        margin: 0,
        marginBottom: 'var(--space-1)',
      }}>
        {title}
      </p>
      <p style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-subtle)',
        margin: 0,
      }}>
        {subtitle}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   GOVERNANCE MODE — Ben's Inbox
   ═══════════════════════════════════════════════ */
function GovernanceView({ governanceProps }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <GovernanceSection {...governanceProps} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COCKPIT (OVERVIEW) MODE — Read-only intelligence
   ═══════════════════════════════════════════════ */
function CockpitView({ setTab, nasProps, riskProps, channelsProps }) {
  const handleGoToGoals       = () => setTab?.('goals');
  const handleGoToExperiments = () => setTab?.('experiments');

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ══════════ MEASURE ══════════ */}
      <div style={{ marginBottom: SECTION_GAP }}>
        <SectionHeader label="Measure" sub="Are we on track?" />

        <div style={{ marginBottom: WIDGET_GAP }}>
          <NorthStarGoal onAddGoal={handleGoToGoals} />
        </div>

        <div style={{ marginBottom: WIDGET_GAP }}>
          <FinancialMetrics />
        </div>
      </div>

      {/* ══════════ CLIENT BACKLOG PIPELINE ══════════ */}
      <div style={{ marginBottom: SECTION_GAP }}>
        <BacklogPipeline />
      </div>

      {/* ══════════ INTELLIGENCE ══════════ */}
      <div style={{ marginBottom: SECTION_GAP }}>
        <SectionHeader label="Intelligence" sub="Signals & scoring" />

        <div style={{ display: 'flex', gap: COL_GAP, alignItems: 'stretch' }}>
          {channelsProps ? (
            <ChannelsSection {...channelsProps} />
          ) : (
            <PlaceholderCard icon={"\ud83d\udce1"} title="Channels" subtitle="Loading channels..." />
          )}
          {riskProps ? (
            <RiskSignalsSection {...riskProps} />
          ) : (
            <PlaceholderCard icon={"\u26a1"} title="Risk Signals" subtitle="Loading risk data..." />
          )}
          {nasProps ? (
            <NASSection {...nasProps} />
          ) : (
            <PlaceholderCard icon={"\ud83d\udcc8"} title="Nouvia Adoption Score" subtitle="Loading adoption data..." />
          )}
        </div>
      </div>

      {/* ══════════ BUILD ══════════ */}
      <div style={{ marginBottom: SECTION_GAP }}>
        <SectionHeader label="Build" sub="What do I do today?" />

        <div style={{ display: 'flex', gap: COL_GAP, alignItems: 'flex-start' }}>
          <WidgetCard flex="1.2">
            <WidgetLabel>OKR Progress</WidgetLabel>
            <OKRProgress />
          </WidgetCard>

          <WidgetCard flex="1.5">
            <WidgetLabel>Top Priorities</WidgetLabel>
            <PrioritySequence onNavigate={() => setTab?.('coworkers')} />
          </WidgetCard>

          <WidgetCard flex="1.2">
            <WidgetLabel>This Week</WidgetLabel>
            <WeeklyTodos />
          </WidgetCard>
        </div>
      </div>

      {/* ══════════ LEARN ══════════ */}
      <div style={{ marginBottom: SECTION_GAP }}>
        <SectionHeader label="Learn" sub="What did we just learn?" />

        <div style={{ marginBottom: WIDGET_GAP }}>
          <FlywheelConnection />
        </div>

        <div style={{ display: 'flex', gap: COL_GAP, alignItems: 'flex-start' }}>
          <WidgetCard flex="1.2">
            <WidgetLabel>Key Findings</WidgetLabel>
            <KeyFindings />
          </WidgetCard>

          <WidgetCard flex="1">
            <WidgetLabel>Experiments</WidgetLabel>
            <ExperimentSummary onNavigate={handleGoToExperiments} />
          </WidgetCard>
        </div>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN EXPORT — routes to correct view by mode
   ═══════════════════════════════════════════════ */
export default function DashboardTab({ mode = "overview", setTab, nasProps, riskProps, channelsProps, governanceProps }) {
  if (mode === "governance") {
    return <GovernanceView governanceProps={governanceProps} />;
  }

  return (
    <CockpitView
      setTab={setTab}
      nasProps={nasProps}
      riskProps={riskProps}
      channelsProps={channelsProps}
    />
  );
}
