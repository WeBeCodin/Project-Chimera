/**
 * Streaming Indicator Component
 * 
 * Shows AI response status and provides stop functionality
 */

'use client';

export interface StreamingIndicatorProps {
  onStop?: () => void;
}

export function StreamingIndicator({ onStop }: StreamingIndicatorProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="text-sm text-blue-700">AI is generating response...</span>
      </div>
      
      {onStop && (
        <button
          onClick={onStop}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Stop
        </button>
      )}
    </div>
  );
}