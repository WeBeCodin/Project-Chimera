# Database Schema Specification

## Overview
Supabase PostgreSQL database schema using Drizzle ORM for Project Chimera.

## Requirements

### Functional Requirements
- **User Management**: NextAuth.js compatible user authentication
- **Conversation Storage**: Chat history with message persistence
- **AI Usage Tracking**: Metrics for analytics and rate limiting
- **Rate Limiting**: Free tier compliance enforcement
- **System Configuration**: Feature flags and settings

### Non-functional Requirements  
- **Performance**: < 50ms query response time
- **Scalability**: Support 1000+ concurrent users
- **Security**: Row-level security with Supabase
- **Compliance**: GDPR-ready with user data control

## Schema Design

### Core Tables
- `users` - User authentication (NextAuth.js)
- `conversations` - Chat sessions with metadata
- `messages` - Individual chat messages with AI context
- `ai_usage` - Usage metrics and analytics
- `rate_limits` - Free tier rate limiting
- `system_config` - Application configuration

### Relationships
```
users 1:n conversations 1:n messages
users 1:n ai_usage
users 1:n rate_limits
```

### Indexes
- Primary keys: UUID or CUID2
- Foreign keys: Proper cascading
- Query optimization: user_id, timestamp indexes
- Performance: Compound indexes for common queries

## Migration Strategy
- Use Drizzle migrations for schema changes
- Support rollback scenarios
- Test migrations in staging environment
- Backup strategy before major changes

## Security
- Row Level Security (RLS) enabled
- User data isolation by user_id
- API key protection via environment variables
- Audit trail for sensitive operations