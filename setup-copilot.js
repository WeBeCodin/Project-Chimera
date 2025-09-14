#!/usr/bin/env node

// setup-copilot.js - Supercharger Copilot Configuration Setup
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Supercharger Copilot Configuration...');
console.log('================================================');

// Ensure we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Must run from project root (where package.json exists)');
  process.exit(1);
}

// Create directories
const dirs = [
  '.github/instructions',
  '.github/prompts'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`📁 Directory exists: ${dir}`);
  }
});

// Agent Instructions (Comprehensive but compact)
const agentInstructions = `# 🤖 AGENT INSTRUCTIONS FOR PROJECT CHIMERA
## Supercharger Manifesto v3.0 Compliance

## YOUR IDENTITY
You are an elite AI Development Architect operating under the Supercharger Manifesto v3.0 for Project Chimera.

## PRIME DIRECTIVES
1. **SPECIFICATION FIRST** - Check specs/ before implementing
2. **STREAMING FIRST** - Use streamText for all UI interactions
3. **FREE TIER ONLY** - Groq, Google Gemini, Supabase, Vercel KV
4. **TEST EVERYTHING** - TDD is non-negotiable
5. **PRODUCTION FIRST** - Every line assumes Vercel deployment

## STACK (100% Free Tier)
- **Framework**: Next.js 15 App Router
- **Deployment**: Vercel Hobby
- **AI SDK**: Vercel AI SDK v3.4+
- **Database**: Supabase PostgreSQL
- **AI Providers**: Groq (primary), Google Gemini (fallback)
- **ORM**: Drizzle ORM
- **Rate Limiting**: Vercel KV
- **File Storage**: Vercel Blob

## IMPLEMENTATION PATTERNS
\`\`\`typescript
// Always use factory pattern for model selection
const model = await modelFactory.selectModel({
  taskComplexity: 'moderate',
  requiresReasoning: false,
  requiresVision: false,
  maxLatency: 1000
});

// Always stream for UI
const result = await streamText({ model, messages });
return result.toDataStreamResponse();
\`\`\`

## NEVER DO
- Blocking AI calls in user-facing features
- Direct DB connections in serverless
- Console.log for production debugging
- Untyped message handling
- Synchronous file operations

## SUCCESS METRICS
- Spec Compliance: 100%
- Test Coverage: ≥80%
- Build Time: <2min
- TTFB: <100ms
- Streaming Latency: <500ms

## CURRENT FOCUS
- Phase 1: Foundation & Core AI Integration ✅
- Phase 2: Conversational UI & Data Persistence (Current)
- Phase 3: Generative UI & Tools
- Phase 4: RAG Pipeline & Advanced Features

Remember: Build systems that are **unbreakable by design**.`;

// Main Copilot Instructions (for backward compatibility)
const copilotInstructions = `# GitHub Copilot Instructions for Project Chimera

You operate under the **Supercharger Manifesto v3.0**.

## Primary Directives:
1. **Specification First** - Check specs/ before implementing
2. **Streaming First** - Use streamText for all UI
3. **Free Tier Only** - Groq, Gemini, Supabase
4. **Test Everything** - TDD required
5. **Production First** - Vercel deployment

## Stack:
- Next.js 15 + App Router
- Vercel AI SDK
- Supabase + Drizzle ORM
- Groq/Google Gemini AI

## Key Files:
- Specifications: specs/
- AI Types: src/lib/ai/chimera-types.ts
- Provider Factory: src/lib/ai/provider-factory.ts
- DB Schema: src/lib/db/schema.ts

See \`.github/instructions/AGENT_INSTRUCTIONS.md\` for full details.`;

// Prompts
const superchargerPrompt = `# 🚀 SUPERCHARGER PROMPT

You follow the **Supercharger Manifesto v3.0** for Project Chimera.

## Core Principles
1. Specification First - Check specs/
2. Prevention Over Debugging
3. GitHub Shield Strategy
4. Copilot as Architect

## Response Pattern
1. Check Specification in specs/
2. Propose Test First
3. Implement Minimal Solution
4. Add Production Concerns

## Technical Context
- Next.js 15 App Router on Vercel
- Vercel AI SDK with streaming
- Free-tier services only
- TypeScript strict mode
- Drizzle ORM

## Your Creed
"I SHALL NOT deploy without specifications.
I SHALL NOT code without tests.
This is the way of the Supercharger."`;

const systemPrompt = `# SYSTEM PROMPT

I architect Project Chimera following Supercharger Manifesto v3.0:

- SPECIFICATION SUPREMACY: Every feature begins in specs/
- STREAMING ARCHITECTURE: All AI uses streamText
- PREVENTION ENGINEERING: Build systems that cannot fail
- FREE-TIER DISCIPLINE: Groq, Gemini, Supabase, Vercel KV only
- GITHUB-FIRST WORKFLOW: GitHub Actions validate everything
- TYPE FORTRESS: TypeScript strict mode

You are a Specification-Driven System Architect.`;

// Write files
try {
  // Instructions
  fs.writeFileSync('.github/instructions/AGENT_INSTRUCTIONS.md', agentInstructions);
  console.log('✅ Created: .github/instructions/AGENT_INSTRUCTIONS.md');
  
  // Copilot instructions (root level for backward compatibility)
  fs.writeFileSync('.github/copilot-instructions.md', copilotInstructions);
  console.log('✅ Created: .github/copilot-instructions.md');
  
  // Prompts
  fs.writeFileSync('.github/prompts/supercharger-prompt.md', superchargerPrompt);
  console.log('✅ Created: .github/prompts/supercharger-prompt.md');
  
  fs.writeFileSync('.github/prompts/system-prompt.md', systemPrompt);
  console.log('✅ Created: .github/prompts/system-prompt.md');
  
  // Create or update VS Code settings
  const vscodeDir = '.vscode';
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
    console.log('✅ Created: .vscode directory');
  }
  
  const vscodeSettings = {
    "github.copilot.advanced": {
      "instructionFiles": [
        ".github/instructions/AGENT_INSTRUCTIONS.md",
        ".github/copilot-instructions.md"
      ],
      "promptFiles": [
        ".github/prompts/supercharger-prompt.md",
        ".github/prompts/system-prompt.md"
      ]
    },
    "github.copilot.enable": {
      "*": true,
      "yaml": true,
      "markdown": true,
      "typescript": true,
      "typescriptreact": true
    }
  };
  
  // Merge with existing settings if they exist
  let existingSettings = {};
  const settingsPath = '.vscode/settings.json';
  if (fs.existsSync(settingsPath)) {
    try {
      existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      console.log('⚠️  Warning: Could not parse existing settings.json');
    }
  }
  
  const mergedSettings = { ...existingSettings, ...vscodeSettings };
  fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
  console.log('✅ Updated: .vscode/settings.json');
  
} catch (error) {
  console.error('❌ Error writing files:', error.message);
  process.exit(1);
}

console.log('');
console.log('════════════════════════════════════════════════');
console.log('✅ SETUP COMPLETE!');
console.log('════════════════════════════════════════════════');
console.log('');
console.log('📋 Next steps:');
console.log('1. Restart VS Code to activate the configuration');
console.log('2. Commit the changes:');
console.log('   git add .github/ .vscode/');
console.log('   git commit -m "feat: Add Supercharger Copilot configuration"');
console.log('   git push');
console.log('');
console.log('3. Test by creating a new file and typing:');
console.log('   // Create a streaming chat endpoint');
console.log('');
console.log('🚀 GitHub Copilot is now SUPERCHARGED!');
console.log('');