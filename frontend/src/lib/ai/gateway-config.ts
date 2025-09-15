/**
 * Vercel AI Gateway Configuration
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Configuration for AI Gateway integration with observability,
 * caching, cost tracking, and automatic failover.
 */

import type { AIGatewayConfig, AIProvider } from './chimera-types';

export const aiGatewayConfig: AIGatewayConfig = {
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  providers: {
    primary: {
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
      maxRetries: 3,
      timeout: 30000,
    },
    fallback: {
      provider: 'google',
      model: 'gemini-1.5-flash',
      maxRetries: 2,
      timeout: 45000,
    },
    reasoning: {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      maxRetries: 2,
      timeout: 60000,
    }
  },
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour for identical prompts
    keyStrategy: 'hash', // Hash of prompt + model
  },
  observability: {
    logLevel: 'info',
    metrics: ['latency', 'tokens', 'cost', 'errors'],
    alertThresholds: {
      errorRate: 0.05, // 5%
      latencyP95: 5000, // 5 seconds
      costPerHour: 10, // $10
    }
  }
};

// Rate limiting configuration by tier
export const rateLimitConfig = {
  free: {
    requestsPerHour: 100,
    tokensPerMonth: 50000,
    concurrentRequests: 5,
  },
  pro: {
    requestsPerHour: 1000,
    tokensPerMonth: 1000000,
    concurrentRequests: 25,
  },
  enterprise: {
    requestsPerHour: -1, // unlimited
    tokensPerMonth: -1, // unlimited
    concurrentRequests: 100,
  }
};

// Model presets for different use cases
export const modelPresets = {
  fast: {
    provider: 'groq' as AIProvider,
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    maxTokens: 1000,
    description: 'Quick responses, simple tasks'
  },
  balanced: {
    provider: 'groq' as AIProvider,
    model: 'llama-3.1-70b-versatile',
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Balanced quality and speed'
  },
  powerful: {
    provider: 'google' as AIProvider,
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 4000,
    description: 'High-quality responses with vision support'
  },
  reasoning: {
    provider: 'anthropic' as AIProvider,
    model: 'claude-3-opus-20240229',
    temperature: 0.1,
    maxTokens: 4000,
    description: 'Deep reasoning and analysis'
  }
};

// Gateway health check configuration
export const healthCheckConfig = {
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  retries: 3,
  endpoints: {
    groq: 'https://api.groq.com/openai/v1/models',
    google: 'https://generativelanguage.googleapis.com/v1beta/models',
    anthropic: 'https://api.anthropic.com/v1/messages'
  }
};

// Cost tracking configuration
export const costConfig = {
  providers: {
    groq: {
      inputTokenCost: 0.00059, // per 1K tokens
      outputTokenCost: 0.00079, // per 1K tokens
      currency: 'USD'
    },
    google: {
      inputTokenCost: 0.000125, // per 1K tokens
      outputTokenCost: 0.000375, // per 1K tokens
      currency: 'USD'
    },
    anthropic: {
      inputTokenCost: 0.015, // per 1K tokens
      outputTokenCost: 0.075, // per 1K tokens
      currency: 'USD'
    }
  },
  budgetAlerts: {
    dailyLimit: 50, // $50/day
    weeklyLimit: 300, // $300/week
    monthlyLimit: 1000, // $1000/month
  }
};

/**
 * Get AI Gateway configuration with environment overrides
 */
export function getAIGatewayConfig(): AIGatewayConfig {
  return {
    ...aiGatewayConfig,
    baseURL: process.env.VERCEL_AI_GATEWAY_URL || aiGatewayConfig.baseURL,
    observability: {
      ...aiGatewayConfig.observability,
      logLevel: (process.env.AI_GATEWAY_LOG_LEVEL as any) || aiGatewayConfig.observability.logLevel,
    }
  };
}

/**
 * Get rate limit for workspace tier
 */
export function getRateLimitForTier(tier: 'free' | 'pro' | 'enterprise') {
  return rateLimitConfig[tier];
}

/**
 * Get model preset configuration
 */
export function getModelPreset(preset: keyof typeof modelPresets) {
  return modelPresets[preset];
}

/**
 * Calculate estimated cost for token usage
 */
export function calculateCost(
  provider: AIProvider,
  inputTokens: number,
  outputTokens: number
): number {
  const config = costConfig.providers[provider];
  if (!config) return 0;
  
  const inputCost = (inputTokens / 1000) * config.inputTokenCost;
  const outputCost = (outputTokens / 1000) * config.outputTokenCost;
  
  return inputCost + outputCost;
}

/**
 * Check if cost exceeds budget limits
 */
export function checkBudgetLimits(dailyCost: number, weeklyCost: number, monthlyCost: number) {
  const alerts = costConfig.budgetAlerts;
  
  return {
    dailyExceeded: dailyCost > alerts.dailyLimit,
    weeklyExceeded: weeklyCost > alerts.weeklyLimit,
    monthlyExceeded: monthlyCost > alerts.monthlyLimit,
    totalCost: { daily: dailyCost, weekly: weeklyCost, monthly: monthlyCost }
  };
}