/**
 * Prompt Loader
 *
 * Loads the system prompt for the specified loop type from the
 * prompts/ directory. Extracts only the content between
 * "## SYSTEM PROMPT START" and "## SYSTEM PROMPT END" markers.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROMPT_FILES = {
  weekly: resolve(__dirname, '../../prompts/weekly-scan.md'),
  monthly: resolve(__dirname, '../../prompts/monthly-health.md'),
};

/**
 * Load and extract the system prompt for the given loop type.
 * Strips the file header — only sends the actual prompt to the API.
 */
export function loadPrompt(loopType) {
  const filePath = PROMPT_FILES[loopType];
  if (!filePath) {
    throw new Error(`Unknown loop type: "${loopType}". Expected "weekly" or "monthly".`);
  }

  const raw = readFileSync(filePath, 'utf-8');

  // Extract content between markers
  const startMarker = '## SYSTEM PROMPT START';
  const endMarker = '## SYSTEM PROMPT END';

  const startIdx = raw.indexOf(startMarker);
  const endIdx = raw.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    // If no markers found, use the full file (backward compat)
    return raw.trim();
  }

  // Extract everything after the start marker line, before the end marker
  const afterStart = raw.substring(startIdx + startMarker.length);
  const content = afterStart.substring(0, afterStart.indexOf(endMarker));

  return content.trim();
}
