/**
 * BSP Loop Runner — Main Entry Point
 *
 * Called by Cloud Run on a schedule. Reads LOOP_TYPE from env,
 * loads the matching system prompt, calls Anthropic Messages API
 * with tools, extracts the digest, and delivers via email.
 *
 * Environment variables:
 *   LOOP_TYPE          - "weekly" or "monthly"
 *   ANTHROPIC_API_KEY  - Anthropic API key (from Secret Manager)
 *   BSP_MCP_URL        - BSP MCP server URL
 *   DIGEST_DELIVERY    - "wrapper" (Gmail API) or "gmail_mcp"
 *   BEN_EMAIL          - Destination email
 *   DRY_RUN            - "true" to skip email delivery (for testing)
 *   GMAIL_MCP_URL      - Gmail MCP URL (only if DIGEST_DELIVERY=gmail_mcp)
 */

import { loadPrompt } from './prompts/loader.js';
import { runLoop } from './runner.js';
import { extractDigest } from './utils/digest.js';
import { deliverDigest } from './delivery/router.js';
import { log } from './utils/logger.js';

async function main() {
  const startTime = Date.now();
  const loopType = process.env.LOOP_TYPE;

  if (!loopType || !['weekly', 'monthly'].includes(loopType)) {
    log('error', `Invalid LOOP_TYPE: "${loopType}". Must be "weekly" or "monthly".`);
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    log('error', 'ANTHROPIC_API_KEY is required.');
    process.exit(1);
  }

  if (!process.env.BSP_MCP_URL) {
    log('error', 'BSP_MCP_URL is required.');
    process.exit(1);
  }

  log('info', `BSP Loop Runner starting — loop: ${loopType}`);

  try {
    // Step 1: Load the system prompt for this loop type
    const systemPrompt = loadPrompt(loopType);
    log('info', `System prompt loaded — ${systemPrompt.length} chars`);

    // Step 2: Call Anthropic API with the prompt and tools
    const response = await runLoop(loopType, systemPrompt);
    log('info', `API call complete — ${response.usage?.input_tokens || '?'} input tokens, ${response.usage?.output_tokens || '?'} output tokens`);

    // Step 3: Extract the digest block from the response
    const fullText = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    const digest = extractDigest(fullText);

    if (!digest.markerFound) {
      log('warn', 'Digest markers not found — using fallback extraction from full response. Prompt compliance issue, not a failure.');
    }

    log('info', `Digest extracted — ${digest.subject} (markers: ${digest.markerFound ? 'yes' : 'fallback'})`);

    // Step 4: Deliver the digest
    if (process.env.DRY_RUN === 'true') {
      log('info', 'DRY_RUN mode — skipping email delivery.');
      console.log('\n===== DIGEST PREVIEW =====\n');
      console.log(`Subject: ${digest.subject}`);
      console.log(`\n${digest.body}`);
      console.log('\n===== END PREVIEW =====\n');
    } else {
      await deliverDigest(digest);
      log('info', 'Digest delivered successfully.');
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log('info', `BSP ${loopType} loop complete — ${elapsed}s total`);
    log('info', `Token usage — input: ${response.usage?.input_tokens || '?'}, output: ${response.usage?.output_tokens || '?'}`);

  } catch (error) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log('error', `BSP ${loopType} loop failed after ${elapsed}s: ${error.message}`);
    log('error', error.stack);

    // Attempt to send failure alert
    try {
      await deliverDigest({
        subject: `🔴 BSP ${loopType} loop FAILED`,
        body: `The ${loopType} loop failed.\n\nError: ${error.message}\n\nExecution time: ${elapsed}s\n\nCheck Cloud Logging for full stack trace.`,
        isAlert: true,
      });
    } catch (alertError) {
      log('error', `Failed to send alert email: ${alertError.message}`);
    }

    process.exit(1);
  }
}

main();
