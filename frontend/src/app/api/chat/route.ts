/**
 * Chat API Route - Supercharger Manifesto v3.0 Compliant
 * 
 * Streaming-first chat endpoint with multi-provider AI integration
 * Implements the specifications from specs/features/ai-chat.spec.md
 */

import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { modelFactory } from '@/lib/ai/provider-factory';
import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';
import type { ModelSelectionCriteria } from '@/lib/ai/chimera-types';

export const runtime = 'edge';

interface ChatRequest {
  message: string;
  conversationId?: string;
  model?: 'auto' | 'groq-llama-70b' | 'groq-llama-8b' | 'gemini-flash';
  stream?: boolean;
  tools?: string[];
  context?: {
    ragEnabled?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { 
      message, 
      conversationId, 
      model = 'auto',
      context = {}
    } = body;
    
    // Validate input
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'Message is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare messages array in the format expected by AI SDK
    const messages = [
      { role: 'user' as const, content: message }
    ];

    // Select model based on request
    let selectedModel;
    if (model === 'auto') {
      const criteria: ModelSelectionCriteria = {
        taskComplexity: 'moderate',
        requiresReasoning: message.length > 100,
        requiresVision: false,
        maxLatency: 1000
      };
      selectedModel = await modelFactory.selectModel(criteria);
    } else {
      // Use specific model
      selectedModel = {
        id: getModelId(model),
        provider: getProvider(model),
        capabilities: { maxTokens: context.maxTokens || 4096 }
      };
    }

    // Get model instance
    const modelInstance = await getModelInstance(selectedModel);
    
    // Stream response (mandatory for UI interactions per Supercharger Manifesto)
    const result = await streamText({
      model: modelInstance,
      messages,
      temperature: context.temperature || 0.7,
    });

    // Return streaming response
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Handle different error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Rate limit exceeded. Please try again later.',
              retryAfter: 60
            }
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error.message.includes('API key')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'CONFIGURATION_ERROR',
              message: 'AI service configuration error'
            }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get model instance based on provider configuration
 */
async function getModelInstance(model: any) {
  if (!process.env.GROQ_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('No API keys configured for AI providers');
  }

  switch (model.provider) {
    case 'groq':
      if (!process.env.GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
      }
      return groq(model.id);
      
    case 'google-gemini':
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error('Google Gemini API key not configured');
      }
      return google(model.id);
      
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}

/**
 * Get model ID from model name
 */
function getModelId(model: string): string {
  switch (model) {
    case 'groq-llama-70b':
      return 'llama-3.1-70b-versatile';
    case 'groq-llama-8b':
      return 'llama-3.1-8b-instant';
    case 'gemini-flash':
      return 'gemini-1.5-flash';
    default:
      return 'llama-3.1-70b-versatile';
  }
}

/**
 * Get provider from model name
 */
function getProvider(model: string): string {
  if (model.startsWith('groq-')) {
    return 'groq';
  }
  if (model.startsWith('gemini-')) {
    return 'google-gemini';
  }
  return 'groq'; // default
}