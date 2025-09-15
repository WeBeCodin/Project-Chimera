/**
 * Multi-Tenant Middleware
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Implementation following specs/features/multi-tenant-saas.spec.md
 * Features: Workspace resolution, custom domains, rate limiting
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simulated database lookups (would be replaced with actual DB calls)
async function resolveCustomDomain(hostname: string) {
  // TODO: Query database for custom domain mapping
  // Example: SELECT workspace_id, slug FROM workspaces WHERE custom_domain = hostname
  const customDomainMappings = {
    'ai.example.com': { workspaceId: 'ws_example', workspaceSlug: 'example-corp' },
    'chat.acme.com': { workspaceId: 'ws_acme', workspaceSlug: 'acme-inc' }
  };
  
  return customDomainMappings[hostname as keyof typeof customDomainMappings] || null;
}

async function resolveWorkspaceBySlug(slug: string) {
  // TODO: Query database for workspace by slug
  // Example: SELECT id, slug FROM workspaces WHERE slug = slug
  const workspaceMappings = {
    'demo': { id: 'ws_demo', slug: 'demo' },
    'test': { id: 'ws_test', slug: 'test' },
    'acme': { id: 'ws_acme', slug: 'acme' }
  };
  
  return workspaceMappings[slug as keyof typeof workspaceMappings] || null;
}

async function getWorkspace(workspaceId: string) {
  // TODO: Query database for workspace details
  // Example: SELECT * FROM workspaces WHERE id = workspaceId
  const workspaces = {
    'ws_demo': { id: 'ws_demo', plan: 'free' as const },
    'ws_test': { id: 'ws_test', plan: 'pro' as const },
    'ws_acme': { id: 'ws_acme', plan: 'enterprise' as const }
  };
  
  return workspaces[workspaceId as keyof typeof workspaces] || { id: workspaceId, plan: 'free' as const };
}

function getRateLimitForPlan(plan: 'free' | 'pro' | 'enterprise') {
  const limits = {
    free: { requests: 100, window: 3600 }, // 100 requests per hour
    pro: { requests: 1000, window: 3600 }, // 1000 requests per hour  
    enterprise: { requests: -1, window: 3600 } // unlimited
  };
  
  return limits[plan];
}

// Simplified rate limiter (would use Vercel KV in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(key: string, limit: { requests: number; window: number }): Promise<{ success: boolean; resetTime?: number }> {
  if (limit.requests === -1) return { success: true }; // unlimited
  
  const now = Date.now();
  const stored = rateLimitStore.get(key);
  
  if (!stored || now > stored.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + (limit.window * 1000) });
    return { success: true };
  }
  
  if (stored.count >= limit.requests) {
    return { success: false, resetTime: stored.resetTime };
  }
  
  stored.count++;
  return { success: true };
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  
  // Skip middleware for static files and API routes that don't need workspace context
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/health') ||
    url.pathname.includes('favicon.ico') ||
    url.pathname.includes('.well-known')
  ) {
    return NextResponse.next();
  }
  
  let workspaceId: string | null = null;
  let workspaceSlug: string | null = null;
  
  try {
    // Check for custom domain first
    const customDomain = await resolveCustomDomain(hostname);
    if (customDomain) {
      workspaceId = customDomain.workspaceId;
      workspaceSlug = customDomain.workspaceSlug;
      console.log(`Custom domain resolved: ${hostname} -> ${workspaceSlug}`);
    } else {
      // Extract workspace from subdomain (e.g., demo.projectchimera.app)
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const subdomain = parts[0];
        
        // Skip common subdomains
        if (subdomain && !['www', 'app', 'api', 'projectchimera'].includes(subdomain)) {
          const workspace = await resolveWorkspaceBySlug(subdomain);
          if (workspace) {
            workspaceId = workspace.id;
            workspaceSlug = workspace.slug;
            console.log(`Subdomain resolved: ${subdomain} -> ${workspaceSlug}`);
          }
        }
      }
    }
    
    // Apply workspace-specific rate limits
    if (workspaceId) {
      const workspace = await getWorkspace(workspaceId);
      const rateLimit = getRateLimitForPlan(workspace.plan);
      
      const rateLimitKey = `workspace:${workspaceId}:${Math.floor(Date.now() / (rateLimit.window * 1000))}`;
      const { success, resetTime } = await checkRateLimit(rateLimitKey, rateLimit);
      
      if (!success) {
        return new NextResponse('Rate limit exceeded for workspace', { 
          status: 429,
          headers: {
            'X-Rate-Limit-Reset': resetTime ? Math.floor(resetTime / 1000).toString() : '0',
            'X-Workspace-Plan': workspace.plan,
            'Retry-After': rateLimit.window.toString()
          }
        });
      }
      
      // Add workspace context to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-workspace-id', workspaceId);
      requestHeaders.set('x-workspace-slug', workspaceSlug || '');
      requestHeaders.set('x-workspace-plan', workspace.plan);
      
      // Rewrite URL to include workspace context
      if (url.pathname.startsWith('/api/')) {
        // For API routes, pass workspace in headers
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          }
        });
      } else {
        // For pages, you might want to rewrite to workspace-specific pages
        // url.pathname = `/workspaces/${workspaceSlug}${url.pathname}`;
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          }
        });
      }
    }
    
    // No workspace context found - default behavior
    return NextResponse.next();
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, continue without workspace context
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};