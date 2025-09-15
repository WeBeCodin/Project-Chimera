# Feature: Multi-Tenant SaaS Architecture

## Overview
Transform Project Chimera into a full multi-tenant SaaS platform leveraging Vercel's infrastructure, supporting team workspaces, custom domains, and enterprise-grade isolation.

## User Stories
- As a team admin, I want to create a workspace for my organization
- As a team member, I want to access only my team's data and conversations
- As an enterprise customer, I want my own custom domain (e.g., ai.mycompany.com)
- As a platform admin, I want to monitor usage and costs per tenant
- As a security officer, I want complete data isolation between tenants

## Technical Requirements

### Core Multi-Tenancy Implementation
- [ ] Implement workspace/team concept in data model
- [ ] Row-level security (RLS) in Supabase
- [ ] Tenant isolation at API level
- [ ] Custom domain support via Vercel
- [ ] Per-tenant usage tracking and billing
- [ ] Tenant-specific configuration and features

### Workspace Management
```typescript
// src/lib/workspace/types.ts
export interface Workspace {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  customDomain?: string;
  settings: WorkspaceSettings;
  limits: WorkspaceLimits;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSettings {
  aiProvider: 'groq' | 'google' | 'anthropic' | 'custom';
  defaultModel: string;
  features: {
    ragEnabled: boolean;
    toolsEnabled: boolean;
    customBranding: boolean;
    ssoEnabled: boolean;
  };
  security: {
    ipWhitelist: string[];
    mfaRequired: boolean;
    sessionTimeout: number;
  };
}

export interface WorkspaceLimits {
  maxUsers: number;
  maxConversations: number;
  maxTokensPerMonth: number;
  maxStorageGB: number;
}
```

### Custom Domain Configuration
```typescript
// src/lib/domains/vercel-domains.ts
import { VercelDomainsAPI } from '@vercel/domains';

export class DomainManager {
  async addCustomDomain(workspace: Workspace, domain: string) {
    // Add domain to Vercel project
    await vercelAPI.addDomain({
      domain,
      projectId: process.env.VERCEL_PROJECT_ID,
    });
    
    // Generate SSL certificate
    await vercelAPI.createCertificate({ domain });
    
    // Update workspace record
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { customDomain: domain }
    });
    
    // Configure DNS instructions for customer
    return {
      dnsRecords: [
        { type: 'A', name: '@', value: '76.76.21.21' },
        { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' }
      ]
    };
  }
}
```

## Data Models

```sql
-- Workspace (Tenant) model
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  custom_domain TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced users table with workspace association
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  current_workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workspace memberships with roles
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- All tables now include workspace_id for isolation
ALTER TABLE conversations ADD COLUMN workspace_id UUID REFERENCES workspaces(id) NOT NULL;
ALTER TABLE messages ADD COLUMN workspace_id UUID REFERENCES workspaces(id) NOT NULL;
ALTER TABLE documents ADD COLUMN workspace_id UUID REFERENCES workspaces(id) NOT NULL;

-- Row Level Security Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their workspace's data
CREATE POLICY workspace_isolation ON conversations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

## Middleware for Tenant Resolution

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Check for custom domain
  const customDomain = await resolveCustomDomain(hostname);
  if (customDomain) {
    // Set workspace context from custom domain
    request.headers.set('x-workspace-id', customDomain.workspaceId);
    request.headers.set('x-workspace-slug', customDomain.workspaceSlug);
  } else {
    // Extract workspace from subdomain (e.g., acme.projectchimera.app)
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'projectchimera') {
      const workspace = await resolveWorkspaceBySlug(subdomain);
      if (workspace) {
        request.headers.set('x-workspace-id', workspace.id);
        request.headers.set('x-workspace-slug', workspace.slug);
      }
    }
  }
  
  // Apply workspace-specific rate limits
  const workspaceId = request.headers.get('x-workspace-id');
  if (workspaceId) {
    const workspace = await getWorkspace(workspaceId);
    const rateLimit = getRateLimitForPlan(workspace.plan);
    
    const { success } = await rateLimiter.check(workspaceId, rateLimit);
    if (!success) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Test Scenarios

### E2E Tests for Multi-Tenancy
```typescript
test.describe('Multi-Tenant Workspace', () => {
  test('enforces data isolation between workspaces', async ({ page }) => {
    // Create two workspaces
    const workspace1 = await createTestWorkspace('workspace1');
    const workspace2 = await createTestWorkspace('workspace2');
    
    // Create data in workspace1
    await page.goto(`https://${workspace1.slug}.projectchimera.app`);
    await login(page, workspace1.owner);
    await createConversation(page, 'Workspace 1 Conversation');
    
    // Try to access from workspace2
    await page.goto(`https://${workspace2.slug}.projectchimera.app`);
    await login(page, workspace2.owner);
    
    // Should not see workspace1's data
    await expect(page.locator('[data-testid="conversation-list"]'))
      .not.toContainText('Workspace 1 Conversation');
  });
  
  test('custom domain routing works correctly', async ({ page }) => {
    const workspace = await createTestWorkspace('custom-domain-test');
    await setupCustomDomain(workspace, 'test.example.com');
    
    // Access via custom domain
    await page.goto('https://test.example.com');
    await login(page, workspace.owner);
    
    // Verify correct workspace context
    const workspaceHeader = await page.locator('[data-testid="workspace-name"]').textContent();
    expect(workspaceHeader).toBe(workspace.name);
  });
});
```

## Billing & Usage Tracking

```typescript
// src/lib/billing/usage-tracker.ts
export class UsageTracker {
  async trackUsage(event: UsageEvent) {
    // Record in database
    await prisma.usageEvent.create({
      data: {
        workspaceId: event.workspaceId,
        type: event.type, // 'tokens', 'storage', 'api_calls'
        amount: event.amount,
        metadata: event.metadata,
        timestamp: new Date(),
      }
    });
    
    // Check against limits
    const workspace = await prisma.workspace.findUnique({
      where: { id: event.workspaceId },
      include: { limits: true }
    });
    
    const currentUsage = await this.getCurrentMonthUsage(event.workspaceId);
    
    if (currentUsage.tokens > workspace.limits.maxTokensPerMonth) {
      await this.notifyLimitExceeded(workspace, 'tokens');
      await this.enforceLimit(workspace, 'tokens');
    }
  }
  
  async generateInvoice(workspaceId: string, period: Date) {
    const usage = await this.getUsageForPeriod(workspaceId, period);
    const workspace = await getWorkspace(workspaceId);
    
    const invoice = {
      workspaceId,
      period,
      plan: workspace.plan,
      lineItems: [
        { description: 'Base Plan', amount: getPlanPrice(workspace.plan) },
        { description: 'Token Overage', amount: calculateOverage(usage.tokens, workspace.limits) },
        { description: 'Storage Overage', amount: calculateOverage(usage.storage, workspace.limits) },
      ],
      total: calculateTotal(lineItems),
    };
    
    return invoice;
  }
}
```

## Success Criteria

- [ ] Complete data isolation verified through penetration testing
- [ ] Custom domains resolve correctly with SSL
- [ ] Workspace switching completes in < 500ms
- [ ] Usage tracking accurate to 99.9%
- [ ] Support for 1000+ concurrent workspaces
- [ ] Zero data leakage between tenants
- [ ] Billing calculations accurate to $0.01
- [ ] Admin dashboard shows real-time usage per workspace