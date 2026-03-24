/**
 * Sentinel Reporter Utilities
 */

const SEVERITY_MAP = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
};

export function log(level, message, extra = {}) {
  const entry = {
    severity: SEVERITY_MAP[level] || 'DEFAULT',
    message,
    timestamp: new Date().toISOString(),
    service: 'sentinel-reporter',
    ...extra,
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
