/**
 * Streaming Chat Interface - Supercharger Manifesto v3.0 Compliant
 * 
 * Implements streaming-first chat interface per specs/features/ai-chat.spec.md
 * Uses Vercel AI SDK React hooks for seamless streaming
 */

'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { MessageBubble } from './message-bubble';
import { StreamingIndicator } from './streaming-indicator';
import { ErrorBoundary } from './error-boundary';

export interface StreamingInterfaceProps {
  conversationId?: string;
  initialMessages?: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  onNewConversation?: (id: string) => void;
  tools?: string[];
}

export function StreamingInterface({
  conversationId,
  initialMessages = [],
  onNewConversation,
  tools = []
}: StreamingInterfaceProps) {
  const [model, setModel] = useState<'auto' | 'groq-llama-70b' | 'groq-llama-8b' | 'gemini-flash'>('auto');

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop
  } = useChat({
    api: '/api/chat',
    initialMessages,
    body: {
      conversationId,
      model,
      tools,
      context: {
        ragEnabled: false,
        maxTokens: 4096,
        temperature: 0.7
      }
    },
    onFinish: (message) => {
      console.log('Message completed:', message);
      // Handle message completion (save to database, analytics, etc.)
    },
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      handleSubmit(e);
    }
  };

  const handleStop = () => {
    if (isLoading) {
      stop();
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">AI Chat</h1>
          <div className="flex items-center space-x-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as typeof model)}
              className="px-3 py-1 text-sm border rounded-md bg-white"
              disabled={isLoading}
            >
              <option value="auto">Auto Select</option>
              <option value="groq-llama-70b">Llama 3.1 70B (Groq)</option>
              <option value="groq-llama-8b">Llama 3.1 8B (Groq)</option>
              <option value="gemini-flash">Gemini 1.5 Flash</option>
            </select>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <h2 className="text-lg font-medium mb-2">Welcome to Project Chimera</h2>
              <p>Start a conversation with our AI assistant</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={isLoading && message.role === 'assistant' && message === messages[messages.length - 1]}
              />
            ))
          )}
          
          {isLoading && (
            <StreamingIndicator onStop={handleStop} />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
            <p className="text-red-700 text-sm">
              {error.message || 'An error occurred while processing your request.'}
            </p>
          </div>
        )}

        {/* Input Form */}
        <div className="border-t p-4">
          <form onSubmit={handleFormSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Stop' : 'Send'}
            </button>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Using {model === 'auto' ? 'Auto Selection' : model}</span>
            {messages.length > 0 && (
              <span>{messages.length} messages</span>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}