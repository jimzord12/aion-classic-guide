import type { AppContainer } from '@config/di';
import { betterAuthPlugin } from '@infra/auth/better/betterAuthPlugin';
import { Elysia } from 'elysia';
import { registerUserRoutes } from './routes/user.routes';

export function createApp(container: AppContainer) {
  const app = new Elysia({ name: 'app' })
    .decorate('container', container)
    .use(betterAuthPlugin);

  registerUserRoutes(app as any);

  return app;
}
