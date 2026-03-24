/**
 * Digest Extractor
 *
 * Parses the ===DIGEST_START=== / ===DIGEST_END=== block from
 * Claude's response. Falls back to extracting from the full response
 * if markers are missing (prompt compliance issue — not a failure).
 */

/**
 * Extract the digest from Claude's response text.
 * Returns { subject, body, markerFound } — never returns null.
 */
export function extractDigest(responseText) {
  // Try the structured markers first
  const markerMatch = responseText.match(/===DIGEST_START===([\s\S]*?)===DIGEST_END===/);

  if (markerMatch) {
    const digestContent = markerMatch[1].trim();
    const { subject, body } = extractSubjectAndBody(digestContent);
    return { subject, body, markerFound: true };
  }

  // Fallback: no markers found — use the full response as digest
  // Strip any tool-use artifacts or MCP chatter, keep the prose
  const cleaned = cleanResponse(responseText);
  const { subject, body } = extractSubjectAndBody(cleaned);
  return { subject, body, markerFound: false };
}

/**
 * Extract SUBJECT line and body from digest content.
 */
function extractSubjectAndBody(content) {
  // Try explicit SUBJECT: line
  const subjectMatch = content.match(/^SUBJECT:\s*(.+)$/m);
  if (subjectMatch) {
    const subject = subjectMatch[1].trim();
    const body = content.substring(
      content.indexOf('\n', content.indexOf(subjectMatch[0]))
    ).trim();
    return { subject, body };
  }

  // Try "Nouvia BSP" in a heading-like line
  const headingMatch = content.match(/^#+\s*(Nouvia BSP.+)$/m)
    || content.match(/^(Nouvia BSP\s*[—–-].+)$/m);
  if (headingMatch) {
    return { subject: headingMatch[1].trim(), body: content };
  }

  // Last resort: generate subject from loop type and date
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const isWeekly = content.toLowerCase().includes('market scan')
    || content.toLowerCase().includes('trend')
    || content.toLowerCase().includes('competitor');
  const loopLabel = isWeekly ? 'Weekly Market Scan' : 'Monthly OS Health';

  return {
    subject: `Nouvia BSP — ${loopLabel} (${today})`,
    body: content,
  };
}

/**
 * Clean up raw API response — remove tool call artifacts, keep the synthesis.
 */
function cleanResponse(text) {
  // Remove common artifacts from non-compliant responses
  return text
    .replace(/```json[\s\S]*?```/g, '')  // Remove JSON code blocks (tool results)
    .replace(/\[Tool call:.*?\]/g, '')    // Remove tool call markers
    .replace(/\n{3,}/g, '\n\n')          // Collapse excessive newlines
    .trim();
}
