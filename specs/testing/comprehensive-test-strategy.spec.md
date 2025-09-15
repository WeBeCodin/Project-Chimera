# Testing Strategy: Comprehensive Project Chimera Testing Suite

## Overview
Comprehensive testing strategy following Supercharger Manifesto v3.0 "Test Everything" directive, covering unit tests, integration tests, E2E tests, and performance testing for the enhanced AI chat system and multi-tenant SaaS platform.

## Testing Philosophy
- **Test-Driven Development (TDD)**: Write tests before implementation
- **Specification-Based Testing**: Tests derive directly from specifications
- **Real-World Scenarios**: Tests mirror actual user workflows
- **Performance First**: Test streaming latency and responsiveness
- **Multi-Tenant Isolation**: Verify complete data separation

## Test Categories

### 1. Unit Tests (Jest)

#### AI Provider Factory Tests
```typescript
// tests/unit/ai/provider-factory.test.ts
describe('Enhanced AI Provider Factory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Selection', () => {
    test('selects correct model based on task complexity', async () => {
      const factory = new ModelFactory();
      
      const fastModel = await factory.selectModel({
        taskComplexity: 'simple',
        requiresReasoning: false,
        maxLatency: 500
      });
      
      expect(fastModel.provider).toBe('groq');
      expect(fastModel.id).toContain('8b');
    });

    test('prefers reasoning model for complex tasks', async () => {
      const factory = new ModelFactory();
      
      const reasoningModel = await factory.selectModel({
        taskComplexity: 'complex',
        requiresReasoning: true,
        maxLatency: 10000
      });
      
      expect(reasoningModel.capabilities.reasoning).toBe(true);
      expect(reasoningModel.priority).toBeLessThan(5);
    });

    test('falls back when primary provider is rate limited', async () => {
      const factory = new ModelFactory();
      
      // Simulate rate limiting on Groq
      factory['rateLimits'].set('groq', Date.now() + 60000);
      
      const model = await factory.selectModel({
        taskComplexity: 'moderate',
        requiresReasoning: false,
        maxLatency: 2000
      });
      
      expect(model.provider).toBe('google');
    });
  });

  describe('Error Handling', () => {
    test('categorizes errors correctly', () => {
      const factory = new ModelFactory();
      
      const rateLimitError = new Error('Rate limit exceeded');
      expect(factory['categorizeError'](rateLimitError)).toBe('RATE_LIMIT');
      
      const networkError = new Error('Network timeout');
      expect(factory['categorizeError'](networkError)).toBe('PROVIDER_DOWN');
    });

    test('handles provider failover gracefully', async () => {
      const factory = new ModelFactory();
      
      const error: AIError = {
        code: 'PROVIDER_DOWN',
        message: 'Groq is unavailable',
        provider: 'groq',
        retryable: true
      };
      
      const fallbackModel = await factory.handleError(error);
      expect(fallbackModel).not.toBeNull();
      expect(fallbackModel?.provider).toBe('google');
    });
  });
});
```

#### AI Gateway Configuration Tests
```typescript
// tests/unit/ai/gateway-config.test.ts
describe('AI Gateway Configuration', () => {
  test('calculates costs accurately', () => {
    const groqCost = calculateCost('groq', 1000, 500);
    expect(groqCost).toBeCloseTo(0.00099, 5); // $0.00099
    
    const googleCost = calculateCost('google', 1000, 500);
    expect(googleCost).toBeCloseTo(0.0003125, 5); // $0.0003125
  });

  test('checks budget limits correctly', () => {
    const result = checkBudgetLimits(60, 350, 1200);
    
    expect(result.dailyExceeded).toBe(true);
    expect(result.weeklyExceeded).toBe(true);
    expect(result.monthlyExceeded).toBe(true);
  });

  test('gets correct rate limits for tier', () => {
    const freeLimit = getRateLimitForTier('free');
    expect(freeLimit.requestsPerHour).toBe(100);
    
    const proLimit = getRateLimitForTier('pro');
    expect(proLimit.requestsPerHour).toBe(1000);
    
    const enterpriseLimit = getRateLimitForTier('enterprise');
    expect(enterpriseLimit.requestsPerHour).toBe(-1);
  });
});
```

### 2. Integration Tests (Jest)

#### API Route Tests
```typescript
// tests/integration/api/chat.test.ts
import { POST } from '@/app/api/chat/v2/route';
import { NextRequest } from 'next/server';

describe('/api/chat/v2', () => {
  test('streams AI response correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        config: { model: 'balanced' }
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    
    // Test streaming response
    const reader = response.body?.getReader();
    const { value } = await reader!.read();
    const chunk = new TextDecoder().decode(value);
    
    expect(chunk).toContain('data:');
  });

  test('enforces rate limiting', async () => {
    // Send multiple requests rapidly
    const requests = Array.from({ length: 10 }, () => 
      POST(new NextRequest('http://localhost:3000/api/chat/v2', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-workspace-tier': 'free'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }]
        })
      }))
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

#### Database Integration Tests
```typescript
// tests/integration/database/conversations.test.ts
import { supabase } from '@/lib/db';

describe('Conversation Database Operations', () => {
  let testWorkspaceId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test workspace and user
    const { data: workspace } = await supabase
      .from('workspaces')
      .insert({ name: 'Test Workspace', slug: 'test-workspace' })
      .select()
      .single();
    
    testWorkspaceId = workspace.id;
    
    const { data: user } = await supabase
      .from('users')
      .insert({ email: 'test@example.com', current_workspace_id: testWorkspaceId })
      .select()
      .single();
    
    testUserId = user.id;
  });

  afterEach(async () => {
    // Cleanup
    await supabase.from('users').delete().eq('id', testUserId);
    await supabase.from('workspaces').delete().eq('id', testWorkspaceId);
  });

  test('enforces workspace isolation', async () => {
    // Create conversation in test workspace
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        user_id: testUserId,
        workspace_id: testWorkspaceId,
        title: 'Test Conversation'
      })
      .select()
      .single();

    // Try to access from different workspace context
    const { data: otherWorkspaceConversations } = await supabase
      .from('conversations')
      .select()
      .eq('workspace_id', 'different-workspace-id');

    expect(otherWorkspaceConversations).toHaveLength(0);
  });
});
```

### 3. End-to-End Tests (Playwright)

#### Chat Interface E2E Tests
```typescript
// tests/e2e/chat-streaming.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI Chat Streaming Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'test-token');
    });
  });

  test('displays streaming response in real-time', async ({ page }) => {
    // Start timing
    const startTime = Date.now();
    
    await page.fill('[data-testid="chat-input"]', 'Explain quantum computing in simple terms');
    await page.click('[data-testid="send-button"]');
    
    // Verify thinking indicator appears quickly
    await expect(page.locator('[data-testid="thinking-indicator"]')).toBeVisible({ timeout: 500 });
    
    // Verify first token arrives within 2 seconds
    await expect(page.locator('[data-testid="message-content"]')).toContainText(/.+/, { timeout: 2000 });
    
    const firstTokenTime = Date.now() - startTime;
    expect(firstTokenTime).toBeLessThan(2000);
    
    // Verify streaming continues smoothly
    await page.waitForTimeout(1000);
    const content1 = await page.locator('[data-testid="message-content"]').textContent();
    
    await page.waitForTimeout(1000);
    const content2 = await page.locator('[data-testid="message-content"]').textContent();
    
    expect(content2!.length).toBeGreaterThan(content1!.length);
    
    // Verify completion
    await expect(page.locator('[data-testid="message-complete"]')).toBeVisible({ timeout: 30000 });
  });

  test('handles provider failover transparently', async ({ page }) => {
    // Simulate primary provider failure
    await page.route('**/api/chat/v2', route => {
      const headers = route.request().headers();
      if (headers['x-test-scenario'] === 'failover') {
        // First request fails, second succeeds
        if (!route.request().url().includes('retry')) {
          route.fulfill({ status: 503, body: 'Service unavailable' });
        } else {
          route.continue();
        }
      } else {
        route.continue();
      }
    });

    await page.addInitScript(() => {
      window.testScenario = 'failover';
    });

    await page.fill('[data-testid="chat-input"]', 'Test failover scenario');
    await page.click('[data-testid="send-button"]');
    
    // Should still get response after failover
    await expect(page.locator('[data-testid="message-content"]')).toContainText(/.+/, { timeout: 10000 });
    
    // Check that fallback provider was used
    const providerBadge = page.locator('[data-testid="provider-badge"]');
    await expect(providerBadge).toContainText('google');
  });

  test('respects rate limiting with user feedback', async ({ page }) => {
    // Rapidly send multiple requests
    for (let i = 0; i < 12; i++) {
      await page.fill('[data-testid="chat-input"]', `Message ${i}`);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(100);
    }
    
    // Should show rate limit warning
    await expect(page.locator('[data-testid="rate-limit-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="rate-limit-warning"]')).toContainText(/try again in \d+/);
    
    // Send button should be disabled
    await expect(page.locator('[data-testid="send-button"]')).toBeDisabled();
  });
});
```

#### Multi-Tenant E2E Tests
```typescript
// tests/e2e/multi-tenant.spec.ts
test.describe('Multi-Tenant Workspace Isolation', () => {
  test('enforces complete data isolation between workspaces', async ({ page, context }) => {
    // Create second browser context for different workspace
    const secondContext = await context.browser()?.newContext();
    const secondPage = await secondContext?.newPage();

    // Setup workspace 1
    await page.goto('https://workspace1.projectchimera.app');
    await authenticateUser(page, 'user1@workspace1.com');
    await createConversation(page, 'Workspace 1 Secret Data');
    
    // Setup workspace 2
    await secondPage!.goto('https://workspace2.projectchimera.app');
    await authenticateUser(secondPage!, 'user2@workspace2.com');
    
    // Verify workspace 2 cannot see workspace 1 data
    const conversationList = secondPage!.locator('[data-testid="conversation-list"]');
    await expect(conversationList).not.toContainText('Workspace 1 Secret Data');
    
    // Verify API isolation
    const response = await secondPage!.request.get('/api/conversations');
    const conversations = await response.json();
    
    expect(conversations.every((c: any) => c.workspace_id !== 'workspace1-id')).toBe(true);
    
    await secondContext?.close();
  });
});
```

### 4. Performance Tests

#### Load Testing (Artillery.js)
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  processor: "./load-test-processor.js"

scenarios:
  - name: "AI Chat Load Test"
    weight: 80
    flow:
      - post:
          url: "/api/chat/v2"
          headers:
            Content-Type: "application/json"
            Authorization: "Bearer {{ auth_token }}"
          json:
            messages:
              - role: "user"
                content: "{{ random_prompt }}"
          capture:
            - json: "$.response"
              as: "response"
      
  - name: "Workspace Switching"
    weight: 20
    flow:
      - get:
          url: "/api/workspaces/{{ workspace_id }}/switch"
          headers:
            Authorization: "Bearer {{ auth_token }}"
```

#### Streaming Performance Tests
```typescript
// tests/performance/streaming-performance.test.ts
describe('Streaming Performance', () => {
  test('measures time to first token', async () => {
    const startTime = performance.now();
    
    const response = await fetch('/api/chat/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Simple greeting' }],
        config: { model: 'fast' }
      })
    });

    const reader = response.body!.getReader();
    const { value } = await reader.read();
    
    const timeToFirstToken = performance.now() - startTime;
    
    expect(timeToFirstToken).toBeLessThan(500); // 500ms requirement
  });

  test('measures token streaming consistency', async () => {
    const response = await fetch('/api/chat/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Write a long explanation about AI' }]
      })
    });

    const reader = response.body!.getReader();
    const tokenTimes: number[] = [];
    let lastTime = performance.now();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const currentTime = performance.now();
      tokenTimes.push(currentTime - lastTime);
      lastTime = currentTime;
    }

    // Check that 95% of tokens arrive within 500ms of previous
    const p95 = tokenTimes.sort((a, b) => a - b)[Math.floor(tokenTimes.length * 0.95)];
    expect(p95).toBeLessThan(500);
  });
});
```

## Test Data Management

### Test Fixtures
```typescript
// tests/fixtures/conversations.ts
export const testConversations = {
  simple: {
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi! How can I help you today?' }
    ]
  },
  complex: {
    messages: [
      { role: 'user', content: 'Explain quantum entanglement and its implications for quantum computing, including the mathematical formulation and practical applications in cryptography.' }
    ]
  },
  multiModal: {
    messages: [
      { 
        role: 'user', 
        content: 'Analyze this image and explain what you see',
        dataParts: [
          { type: 'media', mediaType: 'image', url: 'test-image.jpg' }
        ]
      }
    ]
  }
};
```

### Mock Services
```typescript
// tests/mocks/ai-providers.ts
export const mockGroqProvider = {
  streamText: jest.fn().mockImplementation(async ({ messages }) => ({
    textStream: async function* () {
      const response = "This is a mocked response from Groq";
      for (const char of response) {
        yield char;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }))
};

export const mockGoogleProvider = {
  streamText: jest.fn().mockImplementation(async ({ messages }) => ({
    textStream: async function* () {
      const response = "This is a mocked response from Google";
      for (const word of response.split(' ')) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }))
};
```

## Continuous Integration

### Test Pipeline Configuration
```yaml
# .github/workflows/test-suite.yml
name: Comprehensive Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/chimera_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/chimera_test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_BASE_URL: http://localhost:3000
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run performance tests
        run: npm run test:performance
        
      - name: Generate performance report
        run: npm run test:performance:report
```

## Success Metrics

### Test Coverage Requirements
- **Unit Tests**: > 90% code coverage
- **Integration Tests**: 100% API endpoint coverage
- **E2E Tests**: 100% critical user journey coverage
- **Performance Tests**: 95% of scenarios meet SLA requirements

### Performance Benchmarks
- **Time to First Token**: < 500ms (95th percentile)
- **Token Streaming Latency**: < 200ms between tokens (95th percentile)  
- **API Response Time**: < 100ms for non-AI endpoints (95th percentile)
- **Database Query Time**: < 50ms (95th percentile)
- **Workspace Switching**: < 300ms (95th percentile)

### Quality Gates
- All tests must pass before merge
- Performance regression detection (>10% degradation fails)
- Security vulnerability scanning (no high/critical issues)
- Accessibility testing (WCAG 2.1 AA compliance)
- Browser compatibility testing (Chrome, Firefox, Safari, Edge)