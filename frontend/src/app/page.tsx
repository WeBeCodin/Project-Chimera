import { TranscriptEditor } from '@/components/transcript-editor'

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Project Chimera</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Video processing and transcript editing platform
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Features</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Next.js 14+ with App Router
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                TypeScript & Tailwind CSS
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Zustand State Management
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Framer Motion Animations
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Slate.js Transcript Editing
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Architecture</h2>
            <ul className="space-y-2">
              <li className="text-sm">
                <strong>Frontend:</strong> Next.js with React & TypeScript
              </li>
              <li className="text-sm">
                <strong>Backend:</strong> Vercel Functions with Prisma
              </li>
              <li className="text-sm">
                <strong>Infrastructure:</strong> AWS CDK with S3, Lambda & Step Functions
              </li>
              <li className="text-sm">
                <strong>Shared:</strong> TypeScript libraries with Zod validation
              </li>
            </ul>
          </div>
        </div>

        <div>
          <TranscriptEditor />
        </div>

        <footer className="text-center text-sm text-gray-500 pt-8">
          <p>Built with Turborepo monorepo architecture</p>
        </footer>
      </main>
    </div>
  );
}
