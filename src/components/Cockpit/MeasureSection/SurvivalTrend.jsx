import { useState } from 'react';

const CHART_W = 480;
const CHART_H = 180;
const PAD = { top: 20, right: 20, bottom: 32, left: 40 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SurvivalTrend({ history, loading }) {
  const [hover, setHover] = useState(null);

  if (loading) {
    return (
      <div style={{
        padding: 'var(--space-4)', textAlign: 'center',
        color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)',
      }}>
        Loading survival trend...
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-4)', textAlign: 'center',
        color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)',
      }}>
        No survival data yet
      </div>
    );
  }

  const minScore = 0;
  const maxScore = 100;
  const range = maxScore - minScore;

  // Map data points to SVG coords
  const points = history.map((entry, i) => ({
    x: PAD.left + (history.length === 1 ? INNER_W / 2 : (i / (history.length - 1)) * INNER_W),
    y: PAD.top + INNER_H - ((entry.score - minScore) / range) * INNER_H,
    entry,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${PAD.top + INNER_H} L${points[0].x},${PAD.top + INNER_H} Z`;

  // Y-axis gridlines
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border-default)',
      backgroundColor: 'var(--color-bg-elevated)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-muted)', textTransform: 'uppercase',
        letterSpacing: 'var(--letter-spacing-wider)', marginBottom: 'var(--space-2)',
        fontFamily: 'var(--font-sans)',
      }}>
        Survival Trend
      </div>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ width: '100%', height: 'auto', fontFamily: 'var(--font-sans)' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* Y-axis gridlines & labels */}
        {yTicks.map(tick => {
          const y = PAD.top + INNER_H - ((tick - minScore) / range) * INNER_H;
          return (
            <g key={tick}>
              <line
                x1={PAD.left} y1={y} x2={PAD.left + INNER_W} y2={y}
                stroke="var(--color-border-default)" strokeWidth="0.5"
              />
              <text
                x={PAD.left - 6} y={y + 3}
                textAnchor="end" fontSize="10" fill="var(--color-text-muted)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="var(--color-warning)" opacity="0.08" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinejoin="round" />

        {/* Data points + hit areas */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="16" fill="transparent"
              onMouseEnter={() => setHover(i)}
              style={{ cursor: 'pointer' }}
            />
            <circle
              cx={p.x} cy={p.y}
              r={hover === i ? 5 : 3}
              fill={hover === i ? 'var(--color-warning)' : 'var(--color-bg-elevated)'}
              stroke="var(--color-warning)" strokeWidth="2"
            />
          </g>
        ))}

        {/* X-axis date labels */}
        {points.map((p, i) => {
          // Show first, last, and every ~3rd label to avoid overlap
          if (history.length > 5 && i !== 0 && i !== history.length - 1 && i % Math.ceil(history.length / 5) !== 0) return null;
          return (
            <text
              key={i} x={p.x} y={PAD.top + INNER_H + 16}
              textAnchor="middle" fontSize="9" fill="var(--color-text-muted)"
            >
              {formatDate(p.entry.date)}
            </text>
          );
        })}

        {/* Tooltip */}
        {hover !== null && points[hover] && (() => {
          const p = points[hover];
          const entry = p.entry;
          const components = entry.components;
          const lines = [`Score: ${entry.score}%`];
          if (components) {
            if (components.experiments != null) lines.push(`Experiments: ${components.experiments}`);
            if (components.revenue != null)     lines.push(`Revenue: ${components.revenue}`);
            if (components.intelligence != null) lines.push(`Intelligence: ${components.intelligence}`);
            if (components.capability != null)  lines.push(`Capability: ${components.capability}`);
          }

          const tipW = 130;
          const tipH = 14 + lines.length * 14;
          let tipX = p.x - tipW / 2;
          if (tipX < PAD.left) tipX = PAD.left;
          if (tipX + tipW > CHART_W - PAD.right) tipX = CHART_W - PAD.right - tipW;
          const tipY = p.y - tipH - 12;

          return (
            <g>
              <rect
                x={tipX} y={tipY} width={tipW} height={tipH}
                rx="4" fill="var(--color-bg-overlay)" stroke="var(--color-border-default)"
                strokeWidth="0.5"
              />
              <text x={tipX + 8} y={tipY + 13} fontSize="10" fontWeight="600" fill="var(--color-text-primary)">
                {formatDate(entry.date)}
              </text>
              {lines.map((line, li) => (
                <text key={li} x={tipX + 8} y={tipY + 13 + (li + 1) * 14} fontSize="10" fill="var(--color-text-muted)">
                  {line}
                </text>
              ))}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
