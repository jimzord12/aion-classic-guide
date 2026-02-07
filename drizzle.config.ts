import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://localhost/aion';

export default defineConfig({
  schema: './src/infra/db/drizzle/schema',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
} as any);
