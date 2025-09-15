/**
 * Simple Chat Component - Manual Implementation
 * Testing streaming functionality without useChat hook dependency
 */

'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function SimpleChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const currentInput = input.trim();
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          model: 'auto',
          context: {
            temperature: 0.7,
            maxTokens: 2000
          }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Update the assistant message content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: msg.content + chunk }
            : msg
        ));
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      console.error('Chat error:', error);
      setError(error.message || 'An error occurred while processing your request');
      
      // Remove the loading assistant message if it exists
      setMessages(prev => prev.filter(msg => msg.content !== ''));
      
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Project Chimera AI Chat</h1>
        <div className="text-sm text-green-600 font-medium">
          ✓ Ready
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
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-lg break-words ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-900 shadow-sm border'
              }`}>
                <div className="whitespace-pre-wrap">
                  {message.content || (isLoading && message.role === 'assistant' ? 'Thinking...' : '')}
                </div>
                {message.role === 'assistant' && message.content && (
                  <div className="text-xs text-gray-500 mt-2">
                    AI • Auto Selected
                  </div>
                )}
              </div>
            </div>
          ))
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
            {error}
          </p>
          <p className="text-red-600 text-xs mt-1">
            Tip: Make sure GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is set
          </p>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
          <span>Simple streaming chat implementation</span>
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