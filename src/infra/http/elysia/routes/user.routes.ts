import { createUserSchema } from '@core/user/schemas';
import type { Elysia } from 'elysia';
import { t } from 'elysia';

export const registerUserRoutes = (app: Elysia) =>
  app.post(
    '/users',
    async ({ body, container }: any) => {
      const parsed = createUserSchema.parse(body);
      const user = await container.useCases.createUser.execute(parsed);
      return user;
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        name: t.String({ minLength: 2, maxLength: 100 }),
      }),
      response: t.Object({
        id: t.String(),
        email: t.String(),
        name: t.String(),
        createdAt: t.Date(),
      }),
    }
  );
