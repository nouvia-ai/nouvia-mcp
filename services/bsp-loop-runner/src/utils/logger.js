/**
 * Structured Logger
 *
 * Outputs JSON-formatted logs that Cloud Logging parses automatically.
 * Severity levels map to Cloud Logging severity.
 */

const SEVERITY_MAP = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
};

/**
 * Log a structured message.
 * In Cloud Run, JSON to stdout is automatically parsed by Cloud Logging.
 */
export function log(level, message, extra = {}) {
  const entry = {
    severity: SEVERITY_MAP[level] || 'DEFAULT',
    message,
    timestamp: new Date().toISOString(),
    service: 'bsp-loop-runner',
    loopType: process.env.LOOP_TYPE || 'unknown',
    ...extra,
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
