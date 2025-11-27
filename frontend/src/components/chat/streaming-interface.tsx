/**
 * Streaming Chat Interface - Supercharger Manifesto v3.0 Compliant
 * 
 * Implements streaming-first chat interface per specs/features/ai-chat.spec.md
 * Uses Vercel AI SDK React hooks for seamless streaming
 */

'use client';

import { useState } from 'react';
import type { UIMessage } from '@ai-sdk/react';

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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: UIMessage = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: input }]
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.parts.filter(p => p.type === 'text').map(p => 'text' in p ? p.text : '').join('')
          })),
          conversationId,
          model,
          tools,
          context: {
            ragEnabled: false,
            maxTokens: 4096,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
        }
      }

      const assistantMessage: UIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        parts: [{ type: 'text', text: assistantText }]
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err as Error);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Project Chimera AI Chat</h1>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <h2 className="text-lg font-medium mb-2">Welcome to Project Chimera</h2>
            <p className="mb-4">AI-powered chat with streaming responses</p>
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
              <h3 className="font-medium text-gray-900 mb-2">✨ Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Real-time streaming responses</li>
                <li>• Multi-provider AI (Groq + Google Gemini)</li>
                <li>• Automatic model selection</li>
                <li>• Free tier optimized</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                Start typing to begin your conversation
              </p>
            </div>
          </div>
        ) : (
          messages.map((message: UIMessage) => {
            // Extract content from message parts
            const content = message.parts.filter(p => p.type === 'text').map(p => 'text' in p ? p.text : '').join('');
            
            return (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-lg break-words ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-900 shadow-sm border'
              }`}>
                <div className="whitespace-pre-wrap">
                  {content}
                </div>
                {message.role === 'assistant' && (
                  <div className="text-xs text-gray-500 mt-2">
                    AI • {model === 'auto' ? 'Auto' : model}
                  </div>
                )}
              </div>
            </div>
            );
          })
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
          <p className="text-red-700 text-sm">
            {error.message || 'An error occurred. Please check your API keys and try again.'}
          </p>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={handleFormSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        
        <div className="mt-1 text-xs text-gray-400">
          💡 Set GROQ_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY environment variables for full functionality
        </div>
      </div>
    </div>
  );
}