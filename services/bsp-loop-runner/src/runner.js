/**
 * Core Loop Runner
 *
 * Calls the Anthropic Messages API with the system prompt and tools.
 * Weekly loop gets web_search + BSP MCP.
 * Monthly loop gets BSP MCP only.
 */

import Anthropic from '@anthropic-ai/sdk';
import { log } from './utils/logger.js';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8192;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 30_000;

/**
 * Build the tool configuration for the API call.
 * Weekly loop: web_search + BSP MCP
 * Monthly loop: BSP MCP only
 */
function buildToolConfig(loopType) {
  const bspMcpUrl = process.env.BSP_MCP_URL;
  const gmailMcpUrl = process.env.GMAIL_MCP_URL;
  const deliveryMode = process.env.DIGEST_DELIVERY || 'wrapper';

  const tools = [];
  const mcpServers = [];

  // BSP MCP — always included
  mcpServers.push({
    type: 'url',
    url: bspMcpUrl,
    name: 'nouvia-strategist',
  });

  // Web search — weekly only
  if (loopType === 'weekly') {
    tools.push({
      type: 'web_search_20250305',
      name: 'web_search',
    });
  }

  // Gmail MCP — if delivery mode is gmail_mcp
  if (deliveryMode === 'gmail_mcp' && gmailMcpUrl) {
    mcpServers.push({
      type: 'url',
      url: gmailMcpUrl,
      name: 'gmail',
    });
  }

  return { tools, mcpServers };
}

/**
 * Build the user message that triggers the loop.
 */
function buildUserMessage(loopType) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const deliveryMode = process.env.DIGEST_DELIVERY || 'wrapper';

  let message = `Execute ${loopType} loop. Date: ${dateStr}.`;

  // If Gmail MCP delivery, add instruction
  if (deliveryMode === 'gmail_mcp') {
    message += `\n\nAfter generating the digest, call gmail_create_draft with:
- to: ${process.env.BEN_EMAIL || 'benmelchionno@nouvia.ai'}
- subject: the SUBJECT line from your digest
- body: the full digest content`;
  }

  return message;
}

/**
 * Execute the loop — call the API, return the response.
 */
export async function runLoop(loopType, systemPrompt) {
  const client = new Anthropic();

  const { tools, mcpServers } = buildToolConfig(loopType);
  const userMessage = buildUserMessage(loopType);

  log('info', `API call config — model: ${MODEL}, tools: ${tools.length}, MCP servers: ${mcpServers.length}`);
  log('info', `User message: ${userMessage}`);

  const requestBody = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage },
    ],
  };

  // Add tools if any (web_search)
  if (tools.length > 0) {
    requestBody.tools = tools;
  }

  // Add MCP servers
  if (mcpServers.length > 0) {
    requestBody.mcp_servers = mcpServers;
  }

  // Attempt with retry
  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      log('info', `Retry attempt ${attempt} after ${RETRY_DELAY_MS / 1000}s delay...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }

    try {
      const response = mcpServers.length > 0
        ? await client.messages.create(requestBody, {
            headers: { 'anthropic-beta': 'mcp-client-2025-04-04' },
          })
        : await client.messages.create(requestBody);

      // Log stop reason
      log('info', `API response — stop_reason: ${response.stop_reason}, content blocks: ${response.content.length}`);

      return response;

    } catch (error) {
      lastError = error;
      log('error', `API call attempt ${attempt + 1} failed: ${error.message}`);

      // Don't retry on auth errors or invalid requests
      if (error.status === 401 || error.status === 400) {
        throw error;
      }
    }
  }

  throw lastError;
}
