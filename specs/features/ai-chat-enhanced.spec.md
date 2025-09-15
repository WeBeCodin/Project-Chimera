# Feature: Enhanced AI-Powered Chat System with Vercel AI Gateway

## Overview
Implement a state-of-the-art streaming AI chat interface following Project Chimera Re-Architected Section 3.2, utilizing the Vercel AI SDK with AI Gateway for observability, cost control, and resilience.

## User Stories
- As a user, I want real-time streaming responses from AI that feel instantaneous
- As a user, I want my conversations to persist across sessions
- As a user, I want visual loading states while AI is processing
- As a developer, I want automatic failover between AI providers
- As an admin, I want detailed cost tracking and usage metrics

## Technical Requirements

### Core Implementation
- [x] Use Vercel AI SDK `streamText` for ALL user-facing interactions
- [x] Implement `useChat` hook with `ChimeraUIMessage` type safety
- [x] Multi-provider support via factory pattern (Groq primary, Google Gemini fallback)
- [ ] Integrate Vercel AI Gateway for observability and caching
- [ ] Rate limiting using Vercel KV with tiered limits
- [ ] Persist conversations in Supabase with Prisma Accelerate
- [ ] Implement conversation branching and editing

### AI Gateway Configuration
```typescript
// src/lib/ai/gateway-config.ts
export const aiGatewayConfig = {
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  providers: {
    primary: {
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
      maxRetries: 3,
      timeout: 30000,
    },
    fallback: {
      provider: 'google',
      model: 'gemini-1.5-flash',
      maxRetries: 2,
      timeout: 45000,
    },
    reasoning: {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      maxRetries: 2,
      timeout: 60000,
    }
  },
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour for identical prompts
    keyStrategy: 'hash', // Hash of prompt + model
  },
  observability: {
    logLevel: 'info',
    metrics: ['latency', 'tokens', 'cost', 'errors'],
    alertThresholds: {
      errorRate: 0.05, // 5%
      latencyP95: 5000, // 5 seconds
      costPerHour: 10, // $10
    }
  }
};
```

### Type Safety Implementation
```typescript
// src/lib/ai/chimera-types.ts
import { UIMessage } from 'ai';

// Custom data parts for streaming UI
export type ChimeraDataPart =
  | { type: 'thinking'; content: string; duration?: number }
  | { type: 'error'; error: string; retryable: boolean; provider?: string }
  | { type: 'tool-call'; toolName: string; args: any; status: 'pending' | 'success' | 'error' }
  | { type: 'component'; component: string; props: any }
  | { type: 'chart'; data: any; chartType: 'line' | 'bar' | 'pie' | 'scatter' }
  | { type: 'markdown'; content: string; enhanced: boolean }
  | { type: 'code'; language: string; code: string; executable?: boolean }
  | { type: 'media'; mediaType: 'image' | 'video' | 'audio'; url: string; metadata?: any };

// Tool definitions
export type ChimeraTools = 
  | 'searchKnowledge'
  | 'analyzeVideo'
  | 'generateReport'
  | 'executeCode'
  | 'queryDatabase';

// Metadata with telemetry
export interface ChimeraMetadata {
  timestamp: string;
  modelUsed: string;
  provider: 'groq' | 'google' | 'anthropic';
  tokenCount?: number;
  cost?: number;
  latency?: number;
  traceId: string;
  sessionId: string;
  gatewayCache?: 'hit' | 'miss';
}

export type ChimeraUIMessage = UIMessage<ChimeraMetadata, ChimeraDataPart, ChimeraTools>;
```

## API Specification

### Endpoint: `/api/chat/v2`
**Method**: `POST`

**Request Schema**:
```typescript
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string(),
    dataParts: z.array(z.any()).optional(),
  })),
  conversationId: z.string().uuid().optional(),
  config: z.object({
    model: z.enum(['fast', 'balanced', 'powerful', 'reasoning']).default('balanced'),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(4000).default(1000),
    tools: z.array(z.string()).optional(),
  }).optional(),
  context: z.object({
    useRAG: z.boolean().default(false),
    includeHistory: z.boolean().default(true),
    sessionData: z.record(z.any()).optional(),
  }).optional(),
});
```

**Response**: Server-Sent Events stream with AI SDK format

**Response Headers**:
```
X-Conversation-Id: uuid
X-Model-Used: groq/llama-3.1-70b
X-Token-Count: 523
X-Gateway-Cache: hit|miss
X-Trace-Id: uuid
```

## Data Models

```sql
-- Enhanced conversation model with branching support
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT,
  summary TEXT,
  parent_id UUID REFERENCES conversations(id), -- For branching
  is_archived BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages with full AI SDK v5 support
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  parent_message_id UUID REFERENCES messages(id), -- For edits/branches
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- ChimeraMetadata
  data_parts JSONB, -- ChimeraDataPart[]
  tool_invocations JSONB,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking for cost management
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  message_id UUID REFERENCES messages(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  latency_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_usage_metrics_user_date ON usage_metrics(user_id, created_at);
```

## Test Scenarios

### E2E Tests (Playwright)
```typescript
// tests/e2e/chat.spec.ts
test.describe('AI Chat System', () => {
  test('streams response in real-time', async ({ page }) => {
    await page.goto('/chat');
    await page.fill('[data-testid="chat-input"]', 'Explain quantum computing');
    await page.click('[data-testid="send-button"]');
    
    // Verify streaming starts within 500ms
    await expect(page.locator('[data-testid="thinking-indicator"]')).toBeVisible({ timeout: 500 });
    
    // Verify first token appears within 2s
    await expect(page.locator('[data-testid="message-content"]')).toContainText(/.+/, { timeout: 2000 });
    
    // Verify complete response
    await expect(page.locator('[data-testid="message-complete"]')).toBeVisible({ timeout: 30000 });
  });
  
  test('handles provider failover gracefully', async ({ page }) => {
    // Simulate primary provider failure
    await page.route('**/api/chat/v2', route => {
      if (route.request().headers()['x-test-fail-primary'] === 'true') {
        route.fulfill({ status: 503 });
      } else {
        route.continue();
      }
    });
    
    await page.goto('/chat');
    await page.addInitScript(() => {
      window.localStorage.setItem('test-fail-primary', 'true');
    });
    
    await page.fill('[data-testid="chat-input"]', 'Test failover');
    await page.click('[data-testid="send-button"]');
    
    // Should still get response via fallback
    await expect(page.locator('[data-testid="message-content"]')).toContainText(/.+/, { timeout: 5000 });
    
    // Verify fallback provider was used
    const metadata = await page.locator('[data-testid="message-metadata"]').getAttribute('data-provider');
    expect(metadata).toBe('google');
  });
  
  test('enforces rate limiting', async ({ page }) => {
    await page.goto('/chat');
    
    // Send requests up to rate limit
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="chat-input"]', `Message ${i}`);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(100);
    }
    
    // Next request should be rate limited
    await page.fill('[data-testid="chat-input"]', 'Rate limited message');
    await page.click('[data-testid="send-button"]');
    
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText(/try again in \d+ seconds/);
  });
});
```

### Unit Tests (Jest)
```typescript
// tests/unit/provider-factory.test.ts
describe('AI Provider Factory', () => {
  test('selects correct model based on task complexity', async () => {
    const factory = new ModelFactory();
    
    const fastModel = await factory.selectModel({
      taskComplexity: 'simple',
      requiresReasoning: false,
      maxLatency: 500
    });
    expect(fastModel.provider).toBe('groq');
    expect(fastModel.model).toContain('8b');
    
    const powerfulModel = await factory.selectModel({
      taskComplexity: 'complex',
      requiresReasoning: true,
      maxLatency: 10000
    });
    expect(powerfulModel.provider).toBe('anthropic');
    expect(powerfulModel.model).toContain('opus');
  });
  
  test('falls back when primary provider fails', async () => {
    const factory = new ModelFactory();
    jest.spyOn(factory, 'testProviderHealth').mockResolvedValueOnce(false);
    
    const model = await factory.selectModel({
      taskComplexity: 'moderate',
      requiresReasoning: false,
      maxLatency: 2000
    });
    
    expect(model.provider).toBe('google'); // Fallback
  });
});
```

## Monitoring Requirements

### Metrics Dashboard
```yaml
dashboard:
  panels:
    - title: "AI Response Latency"
      metrics:
        - p50_latency_ms
        - p95_latency_ms
        - p99_latency_ms
      group_by: [provider, model]
      
    - title: "Token Usage & Cost"
      metrics:
        - total_tokens_per_hour
        - cost_usd_per_hour
        - avg_tokens_per_request
      group_by: [provider, model, user_tier]
      
    - title: "Error Rates"
      metrics:
        - error_rate_percent
        - timeout_rate_percent
        - rate_limit_hits_per_minute
      alert_thresholds:
        error_rate_percent: 5
        timeout_rate_percent: 2
        
    - title: "Cache Performance"
      metrics:
        - cache_hit_rate
        - cache_savings_usd
        - cached_response_latency
```

### Alerts Configuration
```yaml
alerts:
  - name: "High Error Rate"
    condition: error_rate > 5%
    window: 5_minutes
    severity: critical
    notify: ["pagerduty", "slack"]
    
  - name: "Cost Spike"
    condition: hourly_cost > $10
    window: 1_hour
    severity: warning
    notify: ["slack", "email"]
    
  - name: "Slow Responses"
    condition: p95_latency > 5000ms
    window: 10_minutes
    severity: warning
    notify: ["slack"]
    
  - name: "Provider Degradation"
    condition: provider_error_rate > 10%
    window: 5_minutes
    severity: critical
    auto_action: "failover_to_secondary"
```

## Rollback Strategy

### Feature Flags (Vercel Edge Config)
```typescript
// Edge Config schema
{
  "chat": {
    "enableStreaming": true,
    "enableAIGateway": true,
    "enableCaching": true,
    "enableFailover": true,
    "providers": {
      "primary": "groq",
      "fallback": "google",
      "disabled": []
    },
    "rateLimit": {
      "enabled": true,
      "freeLimit": 100,
      "proLimit": 1000
    }
  }
}
```

### Rollback Procedures
1. **Instant Disable**: Toggle `enableAIGateway` to bypass gateway
2. **Provider Switch**: Change `primary` provider in Edge Config
3. **Graceful Degradation**: Disable `enableStreaming` to fall back to blocking responses
4. **Circuit Breaker**: Auto-disable provider after 5 consecutive failures
5. **Database Rollback**: Migrations are reversible with `prisma migrate rollback`

## GitHub Actions Workflow

```yaml
# .github/workflows/chat-validation.yml
name: AI Chat System Validation
on:
  push:
    paths:
      - 'src/app/api/chat/**'
      - 'src/lib/ai/**'
      - 'specs/features/ai-chat-enhanced.spec.md'

jobs:
  validate-spec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate specification compliance
        run: npx spec-kit validate specs/features/ai-chat-enhanced.spec.md
      
  test-streaming:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm install
      - name: Test streaming functionality
        run: npm test src/lib/ai/streaming.test.ts
        
  test-gateway:
    runs-on: ubuntu-latest
    steps:
      - name: Test AI Gateway integration
        run: |
          curl -X POST ${{ secrets.AI_GATEWAY_URL }}/test \
            -H "Authorization: Bearer ${{ secrets.AI_GATEWAY_TOKEN }}" \
            -d '{"prompt": "test", "model": "groq/llama-3.1-8b"}' \
            --fail
            
  e2e-chat:
    needs: [validate-spec, test-streaming, test-gateway]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm install
      - run: npx playwright install chromium
      - name: Run E2E tests
        run: npm run test:e2e tests/e2e/chat.spec.ts
        env:
          TEST_URL: ${{ secrets.PREVIEW_URL }}
          
  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: [e2e-chat]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel Preview
        run: |
          vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
          vercel build --token=${{ secrets.VERCEL_TOKEN }}
          vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

## Success Criteria

- [ ] Time to first token < 500ms for 95% of requests
- [ ] Streaming works across all major browsers
- [ ] Zero message loss during provider failover
- [ ] Cost tracking accurate to $0.01
- [ ] Rate limiting prevents abuse without affecting legitimate users
- [ ] All conversations properly persisted and retrievable
- [ ] Gateway caching reduces costs by >30%
- [ ] Error rate < 1% in production
- [ ] User satisfaction score > 4.5/5