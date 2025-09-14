/**
 * AI Chat API Route
 * Supercharger Manifesto v3.0 Compliant - Streaming First
 */

import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { modelFactory } from '@/lib/ai/provider-factory';
import type { ChimeraMessage, ModelSelectionCriteria } from '@/lib/ai/chimera-types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { messages, criteria } = await request.json();
    
    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Set default criteria if not provided
    const selectionCriteria: ModelSelectionCriteria = {
      taskComplexity: 'moderate',
      requiresReasoning: false,
      requiresVision: false,
      maxLatency: 1000,
      ...criteria
    };

    // Select appropriate model using factory
    const selectedModel = await modelFactory.selectModel(selectionCriteria);
    
    // Get model instance
    const modelInstance = await getModelInstance(selectedModel);
    
    // Convert messages to proper format
    const coreMessages = (messages as ChimeraMessage[]).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Stream response (mandatory for UI interactions)
    const result = await streamText({
      model: modelInstance,
      messages: coreMessages,
      maxTokens: selectedModel.capabilities.maxTokens
    });

    // Return streaming response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('AI API Error:', error);
    
    // Try fallback if error is retryable
    if (error instanceof Error) {
      const aiError = {
        code: 'UNKNOWN' as const,
        message: error.message,
        retryable: true
      };
      
      try {
        const fallbackModel = await modelFactory.handleError(aiError);
        if (fallbackModel) {
          // Retry with fallback model
          const modelInstance = await getModelInstance(fallbackModel);
          const { messages } = await request.json();
          
          const coreMessages = (messages as ChimeraMessage[]).map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          const result = await streamText({
            model: modelInstance,
            messages: coreMessages,
            maxTokens: fallbackModel.capabilities.maxTokens
          });

          return result.toDataStreamResponse();
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    return new Response('AI service temporarily unavailable', { status: 503 });
  }
}

/**
 * Get model instance for provider
 */
async function getModelInstance(model: any) {
  switch (model.provider) {
    case 'groq':
      const { createGroq } = await import('@ai-sdk/groq');
      const groq = createGroq({
        apiKey: process.env.GROQ_API_KEY
      });
      return groq(model.id);
      
    case 'google-gemini':
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
      });
      return google(model.id);
      
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}