/**
 * Database Schema - Drizzle ORM
 * Supercharger Manifesto v3.0 Compliant
 * 
 * Supabase PostgreSQL schema using Drizzle ORM.
 * Replaces Prisma for better performance and type safety.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  primaryKey
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table for authentication (NextAuth.js compatible)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email)
}));

// Conversations table for chat history
export const conversations = pgTable('conversations', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('conversations_user_id_idx').on(table.userId),
  createdAtIdx: index('conversations_created_at_idx').on(table.createdAt)
}));

// Messages table for individual chat messages
export const messages = pgTable('messages', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  conversationId: varchar('conversation_id', { length: 128 }).references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  provider: varchar('provider', { length: 50 }), // AI provider used
  model: varchar('model', { length: 100 }), // Specific model used
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  conversationIdIdx: index('messages_conversation_id_idx').on(table.conversationId),
  roleIdx: index('messages_role_idx').on(table.role),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt)
}));

// AI Usage Metrics for analytics and rate limiting
export const aiUsage = pgTable('ai_usage', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  requestCount: integer('request_count').default(1).notNull(),
  tokenCount: integer('token_count').default(0).notNull(),
  latencyMs: integer('latency_ms'),
  isError: boolean('is_error').default(false).notNull(),
  errorCode: varchar('error_code', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow().notNull()
}, (table) => ({
  userProviderIdx: index('ai_usage_user_provider_idx').on(table.userId, table.provider),
  timestampIdx: index('ai_usage_timestamp_idx').on(table.timestamp),
  providerModelIdx: index('ai_usage_provider_model_idx').on(table.provider, table.model)
}));

// Rate Limiting table for free tier compliance
export const rateLimits = pgTable('rate_limits', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  requestCount: integer('request_count').default(0).notNull(),
  tokenCount: integer('token_count').default(0).notNull(),
  windowStart: timestamp('window_start').defaultNow().notNull(),
  windowEnd: timestamp('window_end').notNull(),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  resetAt: timestamp('reset_at').notNull()
}, (table) => ({
  userProviderIdx: index('rate_limits_user_provider_idx').on(table.userId, table.provider),
  windowIdx: index('rate_limits_window_idx').on(table.windowStart, table.windowEnd),
  resetIdx: index('rate_limits_reset_idx').on(table.resetAt)
}));

// System Configuration for feature flags and settings
export const systemConfig = pgTable('system_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// NextAuth.js tables (required for authentication)
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 })
}, (table) => ({
  providerProviderAccountIdIdx: primaryKey({
    columns: [table.provider, table.providerAccountId]
  }),
  userIdIdx: index('accounts_user_id_idx').on(table.userId)
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull()
}, (table) => ({
  sessionTokenIdx: index('sessions_session_token_idx').on(table.sessionToken),
  userIdIdx: index('sessions_user_id_idx').on(table.userId)
}));

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull()
}, (table) => ({
  identifierTokenIdx: primaryKey({
    columns: [table.identifier, table.token]
  })
}));

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type AIUsage = typeof aiUsage.$inferSelect;
export type NewAIUsage = typeof aiUsage.$inferInsert;
export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;