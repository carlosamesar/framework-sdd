import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';

function getLlmConfig() {
  const provider = String(process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
  const anthropicModel = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
  const openRouterModel = process.env.CODEX_MODEL || process.env.OPENROUTER_MODEL || 'openai/gpt-5-mini';
  const openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const timeoutMs = Number.parseInt(
    process.env.LLM_TIMEOUT_MS ||
    process.env.ANTHROPIC_TIMEOUT_MS ||
    process.env.OPENROUTER_TIMEOUT_MS ||
    '30000',
    10
  );
  const maxRetries = Number.parseInt(
    process.env.LLM_MAX_RETRIES ||
    process.env.ANTHROPIC_MAX_RETRIES ||
    process.env.OPENROUTER_MAX_RETRIES ||
    '1',
    10
  );

  return {
    provider,
    anthropicModel,
    openRouterModel,
    openRouterBaseUrl,
    timeoutMs,
    maxRetries,
  };
}

export function resolveLlmProvider() {
  return getLlmConfig().provider === 'openrouter' ? 'openrouter' : 'anthropic';
}

export function createToolBoundLlm(tools) {
  const config = getLlmConfig();
  const timeout = Number.isFinite(config.timeoutMs) ? config.timeoutMs : 30000;
  const maxRetries = Number.isFinite(config.maxRetries) ? config.maxRetries : 1;
  const provider = config.provider === 'openrouter' ? 'openrouter' : 'anthropic';

  if (provider === 'openrouter') {
    const llm = new ChatOpenAI({
      model: config.openRouterModel,
      temperature: 0,
      timeout,
      maxRetries,
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: config.openRouterBaseUrl,
      },
    });
    return llm.bindTools(tools);
  }

  return new ChatAnthropic({
    model: config.anthropicModel,
    temperature: 0,
    timeout,
    maxRetries,
  }).bindTools(tools);
}