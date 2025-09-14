/**
 * Project Chimera AI Types
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Core type definitions for AI integration across the platform.
 * Supports multi-provider architecture with Groq (primary) and Google Gemini (fallback).
 */

import type { CoreMessage } from 'ai';

// Provider Types
export type AIProvider = 'groq' | 'google-gemini';

export type ModelCapabilities = {
  reasoning: boolean;
  vision: boolean;
  streaming: boolean;
  maxTokens: number;
  contextWindow: number;
  costTier: 'free' | 'paid';
};

export type ModelConfig = {
  id: string;
  provider: AIProvider;
  name: string;
  capabilities: ModelCapabilities;
  priority: number; // Lower = higher priority
};

// Task Complexity Types
export type TaskComplexity = 'simple' | 'moderate' | 'complex';

export type ModelSelectionCriteria = {
  taskComplexity: TaskComplexity;
  requiresReasoning: boolean;
  requiresVision: boolean;
  maxLatency: number; // milliseconds
  preferredProvider?: AIProvider;
};

// Streaming Types
export type StreamingResponse = {
  content: string;
  isComplete: boolean;
  tokenCount?: number;
  finishReason?: 'stop' | 'length' | 'error';
};

// Message Types (extends Vercel AI SDK)
export type ChimeraMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: AIProvider;
  model?: string;
  tokenCount?: number;
};

// Conversation Types
export type ConversationContext = {
  id: string;
  messages: ChimeraMessage[];
  totalTokens: number;
  lastActivity: Date;
  metadata?: Record<string, unknown>;
};

// Error Types
export type AIError = {
  code: 'RATE_LIMIT' | 'MODEL_ERROR' | 'PROVIDER_DOWN' | 'INVALID_REQUEST' | 'UNKNOWN';
  message: string;
  provider?: AIProvider;
  retryable: boolean;
  retryAfter?: number; // seconds
};

// Factory Types
export type ModelFactoryOptions = {
  fallbackEnabled: boolean;
  maxRetries: number;
  timeout: number;
  rateLimiting: boolean;
};

export type ProviderFactory = {
  selectModel(criteria: ModelSelectionCriteria): Promise<ModelConfig>;
  createStreamingResponse(model: ModelConfig, messages: ChimeraMessage[]): Promise<StreamingResponse>;
  handleError(error: AIError): Promise<ModelConfig | null>;
};

// Rate Limiting Types
export type RateLimitInfo = {
  requests: number;
  tokens: number;
  resetTime: Date;
  provider: AIProvider;
};

// Analytics Types
export type UsageMetrics = {
  provider: AIProvider;
  model: string;
  requestCount: number;
  tokenCount: number;
  averageLatency: number;
  errorRate: number;
  timestamp: Date;
};