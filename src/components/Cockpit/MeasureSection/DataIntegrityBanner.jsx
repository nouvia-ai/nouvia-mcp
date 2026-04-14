import { useState } from 'react';
import useDataIntegrity from '../../../hooks/useDataIntegrity';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DataIntegrityBanner() {
  const { report, loading } = useDataIntegrity();
  const [expanded, setExpanded] = useState(false);

  if (loading || !report) return null;

  const isClean = report.status === 'clean';
  const violations = report.violations || [];

  return (
    <div style={{ marginBottom: 'var(--space-4)', fontFamily: 'var(--font-sans)' }}>
      <button
        onClick={() => !isClean && setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${isClean ? 'var(--color-success)' : 'var(--color-warning)'}`,
          backgroundColor: isClean ? 'rgba(39,174,96,0.06)' : 'rgba(245,166,35,0.06)',
          cursor: isClean ? 'default' : 'pointer',
          width: '100%', textAlign: 'left',
          transition: 'background-color 0.15s',
        }}
      >
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          backgroundColor: isClean ? 'var(--color-success)' : 'var(--color-warning)',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
          {isClean
            ? `Data verified ${formatDate(report.date)}`
            : `${report.violations_found} data issue${report.violations_found !== 1 ? 's' : ''} detected`
          }
        </span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {formatDate(report.date)}
        </span>
        {!isClean && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </button>

      {expanded && violations.length > 0 && (
        <div style={{
          marginTop: 'var(--space-2)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--color-bg-elevated)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                {['Type', 'Collection', 'Details'].map(h => (
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
              {violations.map((v, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--font-weight-medium)', whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-block', padding: '1px 6px', borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-xs)',
                      backgroundColor: v.type === 'FINANCIAL_INCONSISTENCY' ? 'rgba(231,76,60,0.12)' :
                        v.type === 'STALE_DATA' ? 'rgba(245,166,35,0.12)' : 'var(--color-bg-sunken)',
                      color: v.type === 'FINANCIAL_INCONSISTENCY' ? '#E74C3C' :
                        v.type === 'STALE_DATA' ? '#F5A623' : 'var(--color-text-muted)',
                    }}>
                      {v.type}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)' }}>
                    {v.collection}
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-primary)' }}>
                    {v.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
