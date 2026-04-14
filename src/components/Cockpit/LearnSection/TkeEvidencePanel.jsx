import useTkeEvidence from '../../../hooks/useTkeEvidence';

const cardStyle = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-default)',
  backgroundColor: 'var(--color-bg-elevated)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
  padding: 'var(--space-6)',
};

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      textAlign: 'center', flex: '1 1 0', minWidth: 0,
      padding: 'var(--space-2) var(--space-3)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-bg-sunken)',
    }}>
      <div style={{
        fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)',
        color: color || 'var(--color-text-primary)', lineHeight: 'var(--line-height-tight)',
      }}>{value}</div>
      <div style={{
        fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)',
        textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wider)',
        marginTop: 2,
      }}>{label}</div>
    </div>
  );
}

export default function TkeEvidencePanel() {
  const { items, loading, error } = useTkeEvidence();

  if (loading) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)' }}>
        Loading TKE evidence...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>
        Error loading TKE evidence
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)' }}>
        No TKE evidence recorded yet
      </div>
    );
  }

  // Summary stats
  const totalTests = items.length;
  const deltas = items.filter(i => i.delta != null).map(i => i.delta);
  const avgDelta = deltas.length > 0 ? (deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1) : '\u2014';
  const validatedCount = items.filter(i => i.status === 'validated').length;

  return (
    <div style={cardStyle}>
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <StatBadge label="Total Tests" value={totalTests} />
        <StatBadge label="Avg Delta" value={avgDelta !== '\u2014' ? `+${avgDelta}` : avgDelta} color="var(--color-success)" />
        <StatBadge label="Validated" value={validatedCount} color="var(--color-success)" />
      </div>

      {/* Evidence table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-sm)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
            {['Test ID', 'Type', 'Date', 'Run A', 'Run B', 'Delta', 'Status'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: 'var(--space-2) var(--space-3)',
                fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-muted)', textTransform: 'uppercase',
                letterSpacing: 'var(--letter-spacing-wider)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const delta = item.delta;
            const deltaPositive = delta != null && delta > 0;
            return (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--font-weight-medium)' }}>
                  {item.test_id || item.id}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)' }}>
                  {item.type || '\u2014'}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)' }}>
                  {item.date || '\u2014'}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  {item.run_a_score ?? item.run_a ?? '\u2014'}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  {item.run_b_score ?? item.run_b ?? '\u2014'}
                </td>
                <td style={{
                  padding: 'var(--space-2) var(--space-3)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: deltaPositive ? 'var(--color-success)' : delta != null && delta < 0 ? 'var(--color-error)' : 'var(--color-text-primary)',
                }}>
                  {delta != null ? (delta > 0 ? `+${delta}` : delta) : '\u2014'}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    backgroundColor: item.status === 'validated' ? 'var(--color-badge-green-bg, rgba(39,174,96,0.12))'
                      : item.status === 'sealed' ? 'var(--color-badge-purple-bg, rgba(128,90,213,0.12))'
                      : 'var(--color-bg-sunken)',
                    color: item.status === 'validated' ? 'var(--color-badge-green-text, #27AE60)'
                      : item.status === 'sealed' ? 'var(--color-badge-purple-text, #805AD5)'
                      : 'var(--color-text-muted)',
                  }}>
                    {item.status || 'pending'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
