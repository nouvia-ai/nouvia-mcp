/**
 * CapabilityGapWidget — INT-001 TASK-15 (WS2)
 * Read-only dashboard widget: capability gap counts by P1/P2/P3 tier.
 * Loads from getData("strategist:capability_gaps") — same pattern as App.jsx.
 */
import { useState, useEffect } from 'react';
import { getData } from '../../storage';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const TIER_VARIANT = { P1: 'red', P2: 'amber', P3: 'blue' };
const TIERS = ['P1', 'P2', 'P3'];

export default function CapabilityGapWidget({ onNavigate }) {
  const [gaps,    setGaps]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getData('strategist:capability_gaps').then(data => {
      setGaps(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const total  = gaps.length;
  const counts = TIERS.reduce((acc, t) => {
    acc[t] = gaps.filter(g => g.tier === t || g.priority === t).length;
    return acc;
  }, {});
  const hasP1 = counts.P1 > 0;

  const label = {
    fontSize:      'var(--font-size-xs)',
    fontWeight:    'var(--font-weight-medium)',
    color:         'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontFamily:    'var(--font-sans)',
  };

  const bigNum = {
    fontSize:   '2rem',
    fontWeight: 'var(--font-weight-bold)',
    color:      hasP1 ? 'var(--color-badge-red-text)' : 'var(--color-text-primary)',
    fontFamily: 'var(--font-mono)',
    lineHeight:  1.1,
  };

  const subText = {
    fontSize:   'var(--font-size-xs)',
    color:      'var(--color-text-subtle)',
    fontFamily: 'var(--font-sans)',
  };

  const divider = {
    borderTop: '1px solid var(--color-border-default)',
    margin:    'var(--space-3) 0',
  };

  const tierRow = {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    fontSize:       'var(--font-size-xs)',
    fontFamily:     'var(--font-sans)',
    padding:        'var(--space-1) 0',
  };

  return (
    <Card variant="elevated" onClick={onNavigate} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <span style={label}>Capability Gaps</span>
        {hasP1 && <Badge variant="red">P1 alert</Badge>}
      </div>

      {loading ? (
        <p style={subText}>Loading…</p>
      ) : (
        <>
          <div style={bigNum}>{total}</div>
          <p style={{ ...subText, marginTop: 'var(--space-1)' }}>total gaps logged</p>

          {total > 0 && (
            <>
              <div style={divider} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {TIERS.map(t => counts[t] > 0 && (
                  <div key={t} style={tierRow}>
                    <Badge variant={TIER_VARIANT[t]}>{t}</Badge>
                    <span style={{
                      color:      counts[t] > 0 ? 'var(--color-text-secondary)' : 'var(--color-text-ghost)',
                      fontWeight: counts[t] > 0 ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    }}>
                      {counts[t]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {total === 0 && (
            <p style={{ ...subText, marginTop: 'var(--space-2)' }}>No gaps logged.</p>
          )}
        </>
      )}
    </Card>
  );
}
