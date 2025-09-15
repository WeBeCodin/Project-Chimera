/**
 * Project Chimera AI Types - Enhanced for Vercel AI SDK v5
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Core type definitions for AI integration across the platform.
 * Supports multi-provider architecture with Groq (primary) and Google Gemini (fallback).
 * Enhanced with Vercel AI Gateway, streaming UI, and multi-tenant support.
 */

import type { UIMessage } from 'ai';

// Provider Types
export type AIProvider = 'groq' | 'google' | 'anthropic';

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

// Enhanced Streaming Types with UI support
export type StreamingResponse = {
  content: string;
  isComplete: boolean;
  tokenCount?: number;
  finishReason?: 'stop' | 'length' | 'error';
  metadata?: ChimeraMetadata;
  dataParts?: ChimeraDataPart[];
};

// Custom data parts for streaming UI
export type ChimeraDataPart =
  | { type: 'thinking'; content: string; duration?: number }
  | { type: 'error'; error: string; retryable: boolean; provider?: string }
  | { type: 'tool-call'; toolName: string; args: unknown; status: 'pending' | 'success' | 'error' }
  | { type: 'component'; component: string; props: unknown }
  | { type: 'chart'; data: unknown; chartType: 'line' | 'bar' | 'pie' | 'scatter' }
  | { type: 'markdown'; content: string; enhanced: boolean }
  | { type: 'code'; language: string; code: string; executable?: boolean }
  | { type: 'media'; mediaType: 'image' | 'video' | 'audio'; url: string; metadata?: unknown };

// Tool definitions
export type ChimeraTools = 
  | 'searchKnowledge'
  | 'analyzeVideo'
  | 'generateReport'
  | 'executeCode'
  | 'queryDatabase';

// Metadata with telemetry and workspace support
export interface ChimeraMetadata {
  timestamp: string;
  modelUsed: string;
  provider: AIProvider;
  tokenCount?: number;
  cost?: number;
  latency?: number;
  traceId: string;
  sessionId: string;
  workspaceId?: string;
  gatewayCache?: 'hit' | 'miss';
  reasoning?: boolean;
  vision?: boolean;
}

// Enhanced message type using Vercel AI SDK UIMessage
export type ChimeraUIMessage = UIMessage;

// Legacy message type for backward compatibility
export type ChimeraMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  provider?: AIProvider;
  model?: string;
  tokenCount?: number;
  workspaceId?: string;
  dataParts?: ChimeraDataPart[];
  metadata?: ChimeraMetadata;
};

// Conversation Types with workspace support
export type ConversationContext = {
  id: string;
  workspaceId?: string;
  messages: ChimeraMessage[];
  totalTokens: number;
  lastActivity: Date;
  title?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
};

// Error Types
export type AIError = {
  code: 'RATE_LIMIT' | 'MODEL_ERROR' | 'PROVIDER_DOWN' | 'INVALID_REQUEST' | 'WORKSPACE_LIMIT' | 'UNKNOWN';
  message: string;
  provider?: AIProvider;
  retryable: boolean;
  retryAfter?: number; // seconds
  workspaceId?: string;
};

// Factory Types
export type ModelFactoryOptions = {
  fallbackEnabled: boolean;
  maxRetries: number;
  timeout: number;
  rateLimiting: boolean;
  workspaceId?: string;
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
  workspaceId?: string;
  tier: 'free' | 'pro' | 'enterprise';
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
  workspaceId?: string;
  cost?: number;
};

// AI Gateway Configuration Types
export type AIGatewayConfig = {
  baseURL?: string;
  providers: {
    primary: {
      provider: AIProvider;
      model: string;
      maxRetries: number;
      timeout: number;
    };
    fallback: {
      provider: AIProvider;
      model: string;
      maxRetries: number;
      timeout: number;
    };
    reasoning?: {
      provider: AIProvider;
      model: string;
      maxRetries: number;
      timeout: number;
    };
  };
  caching: {
    enabled: boolean;
    ttl: number;
    keyStrategy: 'hash' | 'prompt' | 'context';
  };
  observability: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metrics: Array<'latency' | 'tokens' | 'cost' | 'errors'>;
    alertThresholds: {
      errorRate: number;
      latencyP95: number;
      costPerHour: number;
    };
  };
};

// Chat Request Schema Types
export type ChatConfig = {
  model: 'fast' | 'balanced' | 'powerful' | 'reasoning';
  temperature: number;
  maxTokens: number;
  tools?: string[];
};

export type ChatContext = {
  useRAG: boolean;
  includeHistory: boolean;
  sessionData?: Record<string, unknown>;
};

export type ChatRequest = {
  messages: Array<{
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    dataParts?: ChimeraDataPart[];
  }>;
  conversationId?: string;
  config?: ChatConfig;
  context?: ChatContext;
  workspaceId?: string;
};