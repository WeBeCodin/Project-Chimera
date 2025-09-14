/**
 * Database Connection - Drizzle + Supabase
 * Supercharger Manifesto v3.0 Compliant
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Import postgres using require to avoid ES module issues
const postgres = require('postgres');

// Supabase connection
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
const client = postgres(connectionString);

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;
export * from './schema';