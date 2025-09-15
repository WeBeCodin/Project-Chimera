/**
 * Home Page - Project Chimera
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Main chat interface implementing streaming-first AI interactions
 */

import { SimpleChatInterface } from '@/components/chat/simple-chat-interface';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto h-screen flex flex-col">
        <SimpleChatInterface />
      </div>
    </main>
  );
}
