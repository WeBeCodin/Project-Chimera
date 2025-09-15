/**
 * Home Page - Project Chimera
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Main chat interface implementing streaming-first AI interactions
 */

import { StreamingInterface } from '@/components/chat/streaming-interface';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto h-screen flex flex-col">
        <StreamingInterface />
      </div>
    </main>
  );
}
