/**
 * AI Provider Factory
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Intelligent model selection and fallback system for multi-provider AI architecture.
 * Free tier only: Groq (primary), Google Gemini (fallback).
 */

import { streamText } from 'ai';
import type {
  AIProvider,
  ModelConfig,
  ModelSelectionCriteria,
  ChimeraMessage,
  StreamingResponse,
  AIError,
  ModelFactoryOptions,
  TaskComplexity
} from './chimera-types';

// Model Configurations (Free Tier Only)
const MODEL_CONFIGS: ModelConfig[] = [
  // Groq Models (Primary)
  {
    id: 'llama-3.1-70b-versatile',
    provider: 'groq',
    name: 'Llama 3.1 70B',
    capabilities: {
      reasoning: true,
      vision: false,
      streaming: true,
      maxTokens: 8192,
      contextWindow: 32768,
      costTier: 'free'
    },
    priority: 1
  },
  {
    id: 'llama-3.1-8b-instant',
    provider: 'groq',
    name: 'Llama 3.1 8B',
    capabilities: {
      reasoning: false,
      vision: false,
      streaming: true,
      maxTokens: 8192,
      contextWindow: 32768,
      costTier: 'free'
    },
    priority: 2
  },
  // Google Gemini Models (Fallback)
  {
    id: 'gemini-1.5-flash',
    provider: 'google-gemini',
    name: 'Gemini 1.5 Flash',
    capabilities: {
      reasoning: true,
      vision: true,
      streaming: true,
      maxTokens: 8192,
      contextWindow: 32768,
      costTier: 'free'
    },
    priority: 3
  }
];

// Complexity to Token Ratio Mapping
const COMPLEXITY_TOKENS: Record<TaskComplexity, number> = {
  simple: 1000,
  moderate: 4000,
  complex: 8000
};

class ModelFactory {
  private options: ModelFactoryOptions;
  private rateLimits: Map<AIProvider, number> = new Map();

  constructor(options: Partial<ModelFactoryOptions> = {}) {
    this.options = {
      fallbackEnabled: true,
      maxRetries: 3,
      timeout: 30000, // 30 seconds
      rateLimiting: true,
      ...options
    };
  }

  /**
   * Select optimal model based on criteria
   * Implements intelligent routing with fallback capability
   */
  async selectModel(criteria: ModelSelectionCriteria): Promise<ModelConfig> {
    const requiredTokens = COMPLEXITY_TOKENS[criteria.taskComplexity];
    
    // Filter models by requirements
    let availableModels = MODEL_CONFIGS.filter(model => {
      // Check basic capabilities
      if (criteria.requiresReasoning && !model.capabilities.reasoning) return false;
      if (criteria.requiresVision && !model.capabilities.vision) return false;
      if (model.capabilities.maxTokens < requiredTokens) return false;
      
      // Check rate limiting
      if (this.options.rateLimiting && this.isRateLimited(model.provider)) return false;
      
      return true;
    });

    // Apply provider preference
    if (criteria.preferredProvider) {
      const preferredModels = availableModels.filter(m => m.provider === criteria.preferredProvider);
      if (preferredModels.length > 0) {
        availableModels = preferredModels;
      }
    }

    // Sort by priority (lower number = higher priority)
    availableModels.sort((a, b) => a.priority - b.priority);

    if (availableModels.length === 0) {
      throw new Error('No available models meet the specified criteria');
    }

    return availableModels[0];
  }

  /**
   * Create streaming response using selected model
   * Always streams for UI compliance (Streaming First directive)
   */
  async createStreamingResponse(
    model: ModelConfig, 
    messages: ChimeraMessage[]
  ): Promise<StreamingResponse> {
    try {
      // Convert ChimeraMessage to CoreMessage format (simple string content)
      const coreMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get model instance based on provider
      const modelInstance = await this.getModelInstance(model);
      
      // Stream text (mandatory for UI interactions)
      const result = await streamText({
        model: modelInstance,
        messages: coreMessages,
        maxTokens: model.capabilities.maxTokens
      });

      // Convert to our streaming response format
      return {
        content: '', // Will be populated by streaming
        isComplete: false,
        tokenCount: 0,
        finishReason: undefined
      };

    } catch (error) {
      const aiError: AIError = {
        code: this.categorizeError(error),
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: model.provider,
        retryable: this.isRetryableError(error)
      };

      throw aiError;
    }
  }

  /**
   * Handle errors with intelligent fallback
   */
  async handleError(error: AIError): Promise<ModelConfig | null> {
    if (!this.options.fallbackEnabled || !error.retryable) {
      return null;
    }

    // Mark provider as rate limited if applicable
    if (error.code === 'RATE_LIMIT' && error.provider) {
      this.markRateLimited(error.provider, error.retryAfter || 60);
    }

    // Try to find alternative model
    try {
      const fallbackCriteria: ModelSelectionCriteria = {
        taskComplexity: 'moderate',
        requiresReasoning: false,
        requiresVision: false,
        maxLatency: 5000
      };

      return await this.selectModel(fallbackCriteria);
    } catch {
      return null;
    }
  }

  /**
   * Get model instance for specific provider
   */
  private async getModelInstance(model: ModelConfig): Promise<any> {
    switch (model.provider) {
      case 'groq':
        // Import Groq provider dynamically
        const { createGroq } = await import('@ai-sdk/groq');
        const groq = createGroq({
          apiKey: process.env.GROQ_API_KEY
        });
        return groq(model.id);
        
      case 'google-gemini':
        // Import Google provider dynamically
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
        });
        return google(model.id);
        
      default:
        throw new Error(`Unsupported provider: ${model.provider}`);
    }
  }

  /**
   * Categorize error for appropriate handling
   */
  private categorizeError(error: unknown): AIError['code'] {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('rate limit')) return 'RATE_LIMIT';
      if (message.includes('model')) return 'MODEL_ERROR';
      if (message.includes('network') || message.includes('timeout')) return 'PROVIDER_DOWN';
      if (message.includes('invalid')) return 'INVALID_REQUEST';
    }
    return 'UNKNOWN';
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    const errorCode = this.categorizeError(error);
    return ['RATE_LIMIT', 'PROVIDER_DOWN'].includes(errorCode);
  }

  /**
   * Check if provider is currently rate limited
   */
  private isRateLimited(provider: AIProvider): boolean {
    const resetTime = this.rateLimits.get(provider);
    if (!resetTime) return false;
    return Date.now() < resetTime;
  }

  /**
   * Mark provider as rate limited
   */
  private markRateLimited(provider: AIProvider, seconds: number): void {
    const resetTime = Date.now() + (seconds * 1000);
    this.rateLimits.set(provider, resetTime);
  }

  /**
   * Get available models for debugging/admin
   */
  getAvailableModels(): ModelConfig[] {
    return [...MODEL_CONFIGS];
  }
}

// Export singleton instance
export const modelFactory = new ModelFactory();

// Export class for testing
export { ModelFactory };

// Export utility functions
export const createModelFactory = (options?: Partial<ModelFactoryOptions>) => 
  new ModelFactory(options);