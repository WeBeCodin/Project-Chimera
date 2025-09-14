# GitHub Copilot Instructions for Project Chimera

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

See `.github/instructions/AGENT_INSTRUCTIONS.md` for full details.