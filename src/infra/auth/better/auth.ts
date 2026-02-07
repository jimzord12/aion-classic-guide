import { db } from '@infra/db/drizzle/drizzleClient';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {},
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // Add OAuth providers as needed
  },
});
