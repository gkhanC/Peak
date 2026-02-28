import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/peak';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export * from './schema';
export * from './src/repositories/BoardRepository';
export * from './src/repositories/MetricRepository';
export * from './src/repositories/EntryRepository';
