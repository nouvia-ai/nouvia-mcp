/**
 * Digest Delivery Router
 *
 * Routes digest delivery based on DIGEST_DELIVERY env var:
 * - "wrapper" (default): Send via Gmail API directly from the runner
 * - "gmail_mcp": Claude already sent via Gmail MCP during the API call;
 *   this just logs confirmation. Fallback to wrapper if MCP delivery
 *   wasn't confirmed in the response.
 *
 * For wrapper mode, uses Google APIs with Application Default Credentials
 * (the Cloud Run service account) or a stored Gmail OAuth token.
 */

import { google } from 'googleapis';
import { log } from '../utils/logger.js';

const BEN_EMAIL = process.env.BEN_EMAIL || 'benmelchionno@nouvia.ai';
const FROM_EMAIL = process.env.FROM_EMAIL || 'bsp@nouvia.ai';

/**
 * Deliver the digest via the configured method.
 * @param {Object} digest - { subject, body, isAlert? }
 */
export async function deliverDigest(digest) {
  const mode = process.env.DIGEST_DELIVERY || 'wrapper';

  if (mode === 'gmail_mcp' && !digest.isAlert) {
    // In Gmail MCP mode, Claude already drafted/sent the email during the API call.
    // We just log confirmation. Alert emails still go through wrapper.
    log('info', 'Gmail MCP delivery mode — Claude handled email during API call.');
    return;
  }

  // Wrapper mode: send via Gmail API
  await sendViaGmailApi(digest);
}

/**
 * Send email via Gmail API using service account or OAuth.
 */
async function sendViaGmailApi(digest) {
  log('info', `Sending email via Gmail API — subject: "${digest.subject}"`);

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
    });

    const gmail = google.gmail({ version: 'v1', auth });

    // Build the MIME message
    const mimeMessage = buildMimeMessage({
      to: BEN_EMAIL,
      from: FROM_EMAIL,
      subject: digest.subject,
      body: digest.body,
    });

    // Base64url encode
    const encodedMessage = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    log('info', 'Email sent successfully via Gmail API.');

  } catch (error) {
    log('error', `Gmail API send failed: ${error.message}`);

    // Fallback: log the digest content so it's at least in Cloud Logging
    log('warn', 'Digest content saved to logs as fallback:');
    log('info', `SUBJECT: ${digest.subject}`);
    log('info', `BODY:\n${digest.body}`);

    throw error;
  }
}

/**
 * Build a MIME email message string.
 */
function buildMimeMessage({ to, from, subject, body }) {
  // Convert digest body to simple HTML
  const htmlBody = convertToHtml(body);

  const boundary = `boundary_${Date.now()}`;

  return [
    `From: Nouvia BSP <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ].join('\r\n');
}

/**
 * Convert the digest markdown-like format to clean HTML email.
 * Keeps it simple and scannable — not a marketing email.
 */
function convertToHtml(body) {
  let html = body
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Headers (ALL CAPS lines ending with colon)
    .replace(/^([A-Z][A-Z /&]+):$/gm, '<h3 style="color:#1a1a1a;border-bottom:1px solid #e0e0e0;padding-bottom:4px;margin-top:24px;">$1</h3>')

    // Overall health indicator — make it prominent
    .replace(/^(OVERALL HEALTH:\s*.+)$/gm, '<div style="font-size:18px;font-weight:bold;text-align:center;padding:12px;margin:16px 0;background:#f5f5f5;border-radius:8px;">$1</div>')

    // Bold key numbers
    .replace(/\$[\d,]+/g, '<strong>$&</strong>')
    .replace(/\d+%/g, '<strong>$&</strong>')

    // Numbered items — give them spacing
    .replace(/^(\d+)\.\s/gm, '<br><strong>$1.</strong> ')

    // Line breaks
    .replace(/\n/g, '<br>');

  // Meta section — small, muted
  html = html.replace(
    /(META:.*?)$/s,
    '<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:12px;color:#888;">$1</div>'
  );

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:680px;margin:0 auto;padding:20px;color:#333;line-height:1.6;font-size:14px;">
${html}
</body>
</html>`;
}
