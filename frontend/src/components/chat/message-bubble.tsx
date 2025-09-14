/**
 * Message Bubble Component
 * 
 * Individual message display with streaming support and metadata
 */

'use client';

import { cn } from '@/lib/utils';

export interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: Date;
  };
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] px-4 py-2 rounded-lg break-words",
        isUser 
          ? "bg-blue-600 text-white" 
          : "bg-gray-100 text-gray-900",
        isStreaming && "animate-pulse"
      )}>
        <div className="whitespace-pre-wrap">
          {message.content}
        </div>
        
        {isStreaming && (
          <div className="flex items-center mt-2 text-xs opacity-75">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="ml-2">AI is typing...</span>
          </div>
        )}
      </div>
    </div>
  );
}