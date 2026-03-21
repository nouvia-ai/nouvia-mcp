/**
 * ExperimentsWidget — INT-001 TASK-15 (WS2)
 * Read-only dashboard widget: Active / Validated / Total experiment counts.
 * Props: experiments (array from App.jsx state)
 */
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function ExperimentsWidget({ experiments = [], onNavigate }) {
  const total     = experiments.length;
  const active    = experiments.filter(e => e.status === 'Testing' || e.status === 'Hypothesis').length;
  const validated = experiments.filter(e => e.status === 'Validated').length;
  const pivoted   = experiments.filter(e => e.status === 'Pivoted').length;

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
    color:      'var(--color-text-primary)',
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

  const statRow = {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    fontSize:       'var(--font-size-xs)',
    color:          'var(--color-text-muted)',
    fontFamily:     'var(--font-sans)',
    padding:        'var(--space-1) 0',
  };

  return (
    <Card variant="elevated" onClick={onNavigate} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <span style={label}>Experiments</span>
        {active > 0 && <Badge variant="blue">{active} active</Badge>}
      </div>

      <div style={bigNum}>{total}</div>
      <p style={{ ...subText, marginTop: 'var(--space-1)' }}>total experiments</p>

      {total > 0 && (
        <>
          <div style={divider} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={statRow}>
              <span>Active</span>
              <span style={{ color: 'var(--color-badge-blue-text)', fontWeight: 'var(--font-weight-semibold)' }}>{active}</span>
            </div>
            <div style={statRow}>
              <span>Validated</span>
              <span style={{ color: 'var(--color-badge-green-text)', fontWeight: 'var(--font-weight-semibold)' }}>{validated}</span>
            </div>
            {pivoted > 0 && (
              <div style={statRow}>
                <span>Pivoted</span>
                <span style={{ color: 'var(--color-badge-amber-text)', fontWeight: 'var(--font-weight-semibold)' }}>{pivoted}</span>
              </div>
            )}
          </div>
        </>
      )}

      {total === 0 && (
        <p style={{ ...subText, marginTop: 'var(--space-2)' }}>No experiments yet.</p>
      )}
    </Card>
  );
}
