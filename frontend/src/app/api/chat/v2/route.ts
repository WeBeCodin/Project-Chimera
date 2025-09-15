/**
 * Enhanced AI Chat API v2 Route
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Implementation following specs/features/ai-chat-enhanced.spec.md
 * Features: Vercel AI Gateway, streaming responses, workspace isolation, cost tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { z } from 'zod';
import { modelFactory } from '@/lib/ai/provider-factory';
import { getAIGatewayConfig, calculateCost } from '@/lib/ai/gateway-config';
import type { 
  ChatRequest, 
  ChimeraMetadata, 
  ChimeraDataPart,
  AIError,
  ModelSelectionCriteria
} from '@/lib/ai/chimera-types';

// Request validation schema from specification
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string(),
    dataParts: z.array(z.any()).optional(),
  })),
  conversationId: z.string().uuid().optional(),
  config: z.object({
    model: z.enum(['fast', 'balanced', 'powerful', 'reasoning']).default('balanced'),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(4000).default(1000),
    tools: z.array(z.string()).optional(),
  }).optional(),
  context: z.object({
    useRAG: z.boolean().default(false),
    includeHistory: z.boolean().default(true),
    sessionData: z.record(z.any()).optional(),
  }).optional(),
  workspaceId: z.string().uuid().optional(),
});

// Rate limiting check (simplified for demonstration)
async function checkRateLimit(workspaceId?: string): Promise<boolean> {
  // TODO: Implement Vercel KV rate limiting
  // For now, always allow (would integrate with Vercel KV in production)
  return true;
}

// Generate trace ID for observability
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create model selection criteria from request
function createModelCriteria(config: ChatRequest['config']): ModelSelectionCriteria {
  const modelPreset = config?.model || 'balanced';
  
  switch (modelPreset) {
    case 'fast':
      return {
        taskComplexity: 'simple',
        requiresReasoning: false,
        requiresVision: false,
        maxLatency: 1000
      };
    case 'powerful':
      return {
        taskComplexity: 'complex',
        requiresReasoning: false,
        requiresVision: true,
        maxLatency: 5000
      };
    case 'reasoning':
      return {
        taskComplexity: 'complex',
        requiresReasoning: true,
        requiresVision: false,
        maxLatency: 10000
      };
    default: // balanced
      return {
        taskComplexity: 'moderate',
        requiresReasoning: false,
        requiresVision: false,
        maxLatency: 3000
      };
  }
}

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  const sessionId = request.headers.get('x-session-id') || `session_${Date.now()}`;
  const workspaceId = request.headers.get('x-workspace-id') || undefined;
  
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = ChatRequestSchema.parse(body);
    
    // Check rate limits
    const rateLimitOk = await checkRateLimit(workspaceId);
    if (!rateLimitOk) {
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'X-Rate-Limit-Reset': Math.floor(Date.now() / 1000 + 3600).toString(),
          'X-Trace-Id': traceId
        }
      });
    }

    // Select optimal model
    const criteria = createModelCriteria(validatedRequest.config);
    const selectedModel = await modelFactory.selectModel(criteria);
    
    // Convert messages to proper format
    const messages = validatedRequest.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));

    // Get model instance
    const modelInstance = selectedModel.provider === 'groq' 
      ? (await import('@ai-sdk/groq')).groq(selectedModel.id)
      : selectedModel.provider === 'google'
      ? (await import('@ai-sdk/google')).google(selectedModel.id)
      : (await import('@ai-sdk/anthropic')).anthropic(selectedModel.id);

    // Create metadata for response
    const metadata: ChimeraMetadata = {
      timestamp: new Date().toISOString(),
      modelUsed: selectedModel.id,
      provider: selectedModel.provider,
      traceId,
      sessionId,
      workspaceId,
      reasoning: selectedModel.capabilities.reasoning,
      vision: selectedModel.capabilities.vision
    };

    // Stream response using Vercel AI SDK
    const result = await streamText({
      model: modelInstance,
      messages,
      temperature: validatedRequest.config?.temperature || 0.7,
      onFinish: async (result) => {
        // Calculate cost
        const cost = calculateCost(
          selectedModel.provider, 
          result.usage?.promptTokens || 0,
          result.usage?.completionTokens || 0
        );
        
        metadata.tokenCount = (result.usage?.promptTokens || 0) + (result.usage?.completionTokens || 0);
        metadata.cost = cost;
        
        // TODO: Store conversation in database with workspace isolation
        console.log(`Chat completed: ${traceId}, Cost: $${cost.toFixed(6)}, Tokens: ${metadata.tokenCount}`);
      }
    });

    // Return streaming response with proper headers
    return new NextResponse(result.toTextStreamResponse().body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Conversation-Id': validatedRequest.conversationId || 'new',
        'X-Model-Used': `${selectedModel.provider}/${selectedModel.id}`,
        'X-Trace-Id': traceId,
        'X-Session-Id': sessionId,
        'X-Workspace-Id': workspaceId || 'default',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Chat API error:', error, { traceId });
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request format',
        details: error.errors,
        traceId
      }, { status: 400 });
    }

    // Handle AI provider errors
    if (error && typeof error === 'object' && 'code' in error) {
      const aiError = error as AIError;
      
      // Try fallback if error is retryable
      if (aiError.retryable) {
        const fallbackModel = await modelFactory.handleError(aiError);
        if (fallbackModel) {
          // TODO: Retry with fallback model
          console.log('Falling back to:', fallbackModel.provider);
        }
      }
      
      return NextResponse.json({
        error: aiError.message,
        code: aiError.code,
        retryable: aiError.retryable,
        traceId
      }, { status: 500 });
    }

    // Generic error handling
    return NextResponse.json({
      error: 'Internal server error',
      traceId
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check if AI providers are available
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: 'v2',
      providers: {
        groq: 'available', // TODO: Implement actual health checks
        google: 'available',
        anthropic: 'available'
      }
    };
    
    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed'
    }, { status: 503 });
  }
}