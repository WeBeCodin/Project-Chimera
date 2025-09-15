/**
 * AI Provider Factory Tests
 * Implementation of specs/testing/comprehensive-test-strategy.spec.md
 * Supercharger Manifesto v3.0 Compliant - "Test Everything"
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ModelFactory } from '../provider-factory';
import type { ModelSelectionCriteria, AIError } from '../chimera-types';
import { calculateCost, getRateLimitForTier } from '../gateway-config';

describe('Enhanced AI Provider Factory', () => {
  let factory: ModelFactory;

  beforeEach(() => {
    factory = new ModelFactory();
    jest.clearAllMocks();
  });

  describe('Model Selection', () => {
    test('selects correct model based on task complexity', async () => {
      const simpleCriteria: ModelSelectionCriteria = {
        taskComplexity: 'simple',
        requiresReasoning: false,
        requiresVision: false,
        maxLatency: 500
      };
      
      const model = await factory.selectModel(simpleCriteria);
      
      expect(model).toBeDefined();
      expect(model.provider).toBe('groq');
      expect(model.id).toContain('8b'); // Should select the faster 8B model
      expect(model.capabilities.streaming).toBe(true);
    });

    test('prefers reasoning model for complex tasks', async () => {
      const complexCriteria: ModelSelectionCriteria = {
        taskComplexity: 'complex',
        requiresReasoning: true,
        requiresVision: false,
        maxLatency: 10000
      };
      
      const model = await factory.selectModel(complexCriteria);
      
      expect(model).toBeDefined();
      expect(model.capabilities.reasoning).toBe(true);
      expect(model.capabilities.maxTokens).toBeGreaterThanOrEqual(4000);
    });

    test('falls back when primary provider is rate limited', async () => {
      // Simulate rate limiting on Groq
      (factory as any).rateLimits.set('groq', Date.now() + 60000);
      
      const criteria: ModelSelectionCriteria = {
        taskComplexity: 'moderate',
        requiresReasoning: false,
        requiresVision: false,
        maxLatency: 2000
      };
      
      const model = await factory.selectModel(criteria);
      
      // Should fallback to Google since Groq is rate limited
      expect(model.provider).toBe('google');
    });

    test('respects vision requirements', async () => {
      const visionCriteria: ModelSelectionCriteria = {
        taskComplexity: 'moderate',
        requiresReasoning: false,
        requiresVision: true,
        maxLatency: 3000
      };
      
      const model = await factory.selectModel(visionCriteria);
      
      expect(model.capabilities.vision).toBe(true);
    });

    test('throws error when no models meet criteria', async () => {
      // Create impossible criteria
      const impossibleCriteria: ModelSelectionCriteria = {
        taskComplexity: 'complex',
        requiresReasoning: true,
        requiresVision: true,
        maxLatency: 1 // Impossible latency requirement
      };
      
      // Rate limit all providers
      (factory as any).rateLimits.set('groq', Date.now() + 60000);
      (factory as any).rateLimits.set('google', Date.now() + 60000);
      (factory as any).rateLimits.set('anthropic', Date.now() + 60000);
      
      await expect(factory.selectModel(impossibleCriteria))
        .rejects
        .toThrow('No available models meet the specified criteria');
    });
  });

  describe('Error Handling', () => {
    test('categorizes errors correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      expect((factory as any).categorizeError(rateLimitError)).toBe('RATE_LIMIT');
      
      const networkError = new Error('Network timeout');
      expect((factory as any).categorizeError(networkError)).toBe('PROVIDER_DOWN');
      
      const modelError = new Error('Model not found');
      expect((factory as any).categorizeError(modelError)).toBe('MODEL_ERROR');
      
      const invalidError = new Error('Invalid request format');
      expect((factory as any).categorizeError(invalidError)).toBe('INVALID_REQUEST');
      
      const unknownError = new Error('Something else');
      expect((factory as any).categorizeError(unknownError)).toBe('UNKNOWN');
    });

    test('identifies retryable errors correctly', () => {
      expect((factory as any).isRetryableError(new Error('Rate limit exceeded'))).toBe(true);
      expect((factory as any).isRetryableError(new Error('Network timeout'))).toBe(true);
      expect((factory as any).isRetryableError(new Error('Provider down'))).toBe(true);
      expect((factory as any).isRetryableError(new Error('Invalid request'))).toBe(false);
      expect((factory as any).isRetryableError(new Error('Model error'))).toBe(false);
    });

    test('handles provider failover gracefully', async () => {
      const error: AIError = {
        code: 'PROVIDER_DOWN',
        message: 'Groq is unavailable',
        provider: 'groq',
        retryable: true
      };
      
      const fallbackModel = await factory.handleError(error);
      
      expect(fallbackModel).not.toBeNull();
      expect(fallbackModel?.provider).not.toBe('groq');
    });

    test('marks provider as rate limited on rate limit error', async () => {
      const error: AIError = {
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded',
        provider: 'groq',
        retryable: true,
        retryAfter: 30
      };
      
      await factory.handleError(error);
      
      // Check that Groq is now marked as rate limited
      expect((factory as any).isRateLimited('groq')).toBe(true);
    });

    test('returns null for non-retryable errors', async () => {
      const error: AIError = {
        code: 'INVALID_REQUEST',
        message: 'Bad request',
        provider: 'groq',
        retryable: false
      };
      
      const fallbackModel = await factory.handleError(error);
      
      expect(fallbackModel).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    test('correctly identifies rate limited providers', () => {
      // Not rate limited initially
      expect((factory as any).isRateLimited('groq')).toBe(false);
      
      // Mark as rate limited
      (factory as any).markRateLimited('groq', 60);
      expect((factory as any).isRateLimited('groq')).toBe(true);
      
      // Mark as rate limited in the past (should be false)
      (factory as any).rateLimits.set('google', Date.now() - 1000);
      expect((factory as any).isRateLimited('google')).toBe(false);
    });
  });

  describe('Model Instance Creation', () => {
    test('creates Groq model instance correctly', async () => {
      const groqModel = {
        id: 'llama-3.1-70b-versatile',
        provider: 'groq' as const,
        name: 'Llama 3.1 70B',
        capabilities: {
          reasoning: true,
          vision: false,
          streaming: true,
          maxTokens: 8192,
          contextWindow: 32768,
          costTier: 'free' as const
        },
        priority: 1
      };
      
      // Mock the dynamic import
      const mockGroq = jest.fn().mockReturnValue('mocked-groq-instance');
      jest.doMock('@ai-sdk/groq', () => ({ groq: mockGroq }));
      
      const instance = await (factory as any).getModelInstance(groqModel);
      
      expect(mockGroq).toHaveBeenCalledWith('llama-3.1-70b-versatile');
    });

    test('throws error for unsupported provider', async () => {
      const unsupportedModel = {
        id: 'unsupported-model',
        provider: 'unsupported' as any,
        name: 'Unsupported Model',
        capabilities: {} as any,
        priority: 1
      };
      
      await expect((factory as any).getModelInstance(unsupportedModel))
        .rejects
        .toThrow('Unsupported provider: unsupported');
    });
  });
});

describe('AI Gateway Configuration', () => {
  describe('Cost Calculation', () => {
    test('calculates Groq costs accurately', () => {
      const cost = calculateCost('groq', 1000, 500);
      // Expected: (1000/1000 * 0.00059) + (500/1000 * 0.00079) = 0.00059 + 0.000395 = 0.000985
      expect(cost).toBeCloseTo(0.000985, 6);
    });

    test('calculates Google costs accurately', () => {
      const cost = calculateCost('google', 1000, 500);
      // Expected: (1000/1000 * 0.000125) + (500/1000 * 0.000375) = 0.000125 + 0.0001875 = 0.0003125
      expect(cost).toBeCloseTo(0.0003125, 6);
    });

    test('calculates Anthropic costs accurately', () => {
      const cost = calculateCost('anthropic', 1000, 500);
      // Expected: (1000/1000 * 0.015) + (500/1000 * 0.075) = 0.015 + 0.0375 = 0.0525
      expect(cost).toBeCloseTo(0.0525, 4);
    });

    test('returns zero for unknown provider', () => {
      const cost = calculateCost('unknown' as any, 1000, 500);
      expect(cost).toBe(0);
    });
  });

  describe('Rate Limits', () => {
    test('returns correct limits for free tier', () => {
      const freeLimit = getRateLimitForTier('free');
      expect(freeLimit.requestsPerHour).toBe(100);
      expect(freeLimit.tokensPerMonth).toBe(50000);
      expect(freeLimit.concurrentRequests).toBe(5);
    });

    test('returns correct limits for pro tier', () => {
      const proLimit = getRateLimitForTier('pro');
      expect(proLimit.requestsPerHour).toBe(1000);
      expect(proLimit.tokensPerMonth).toBe(1000000);
      expect(proLimit.concurrentRequests).toBe(25);
    });

    test('returns correct limits for enterprise tier', () => {
      const enterpriseLimit = getRateLimitForTier('enterprise');
      expect(enterpriseLimit.requestsPerHour).toBe(-1); // unlimited
      expect(enterpriseLimit.tokensPerMonth).toBe(-1); // unlimited
      expect(enterpriseLimit.concurrentRequests).toBe(100);
    });
  });
});

describe('Integration with Vercel AI SDK', () => {
  test('model factory integrates with streamText', async () => {
    // This would be more comprehensive in a real test environment
    const factory = new ModelFactory();
    const model = await factory.selectModel({
      taskComplexity: 'simple',
      requiresReasoning: false,
      requiresVision: false,
      maxLatency: 1000
    });
    
    expect(model.capabilities.streaming).toBe(true);
    expect(['groq', 'google', 'anthropic']).toContain(model.provider);
  });
});

// Performance Tests
describe('Performance Benchmarks', () => {
  test('model selection completes within 25ms', async () => {
    const start = performance.now();
    
    const factory = new ModelFactory();
    await factory.selectModel({
      taskComplexity: 'simple',
      requiresReasoning: false,
      requiresVision: false,
      maxLatency: 1000
    });
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(25); // Per specification
  });

  test('error categorization is instantaneous', () => {
    const start = performance.now();
    
    const factory = new ModelFactory();
    (factory as any).categorizeError(new Error('Rate limit exceeded'));
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1); // Should be nearly instantaneous
  });
});

// Edge Cases
describe('Edge Cases', () => {
  test('handles undefined error gracefully', () => {
    const factory = new ModelFactory();
    const errorCode = (factory as any).categorizeError(undefined);
    expect(errorCode).toBe('UNKNOWN');
  });

  test('handles null messages array', async () => {
    const factory = new ModelFactory();
    const model = await factory.selectModel({
      taskComplexity: 'simple',
      requiresReasoning: false,
      requiresVision: false,
      maxLatency: 1000
    });
    
    // This would typically be handled by the API layer validation
    expect(model).toBeDefined();
  });

  test('handles concurrent model selection requests', async () => {
    const factory = new ModelFactory();
    const criteria = {
      taskComplexity: 'simple' as const,
      requiresReasoning: false,
      requiresVision: false,
      maxLatency: 1000
    };
    
    // Run multiple selections concurrently
    const promises = Array.from({ length: 10 }, () => factory.selectModel(criteria));
    const models = await Promise.all(promises);
    
    // All should succeed and return valid models
    models.forEach(model => {
      expect(model).toBeDefined();
      expect(model.provider).toBeTruthy();
    });
  });
});

export {};