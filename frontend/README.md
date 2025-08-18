# Frontend - Project Chimera

Next.js 14+ frontend application for Project Chimera.

## Features

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Shadcn/UI** components (manually configured for Tailwind v4)
- **Zustand** for state management
- **Framer Motion** for animations
- **Slate.js** for transcript editing

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `dev` - Start development server with Turbopack
- `build` - Build the application
- `start` - Start production server
- `lint` - Run ESLint
- `type-check` - Run TypeScript type checking

## Components

- `TranscriptEditor` - Placeholder component for transcript editing using Slate.js
- Store setup in `src/lib/store.ts` using Zustand

## Environment Variables

Create a `.env.local` file with necessary environment variables for your application.

## Architecture

This frontend is part of the Project Chimera monorepo and integrates with:
- Backend API for project and job management
- Shared TypeScript libraries for common types and utilities
