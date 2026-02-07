Here’s a compact, end‑to‑end guide for your Bun + Elysia + Drizzle + Better Auth backend, using clean/hexagonal architecture, Zod, and Vitest/Supertest. [dev](https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi)

---

## 1. High‑level architecture

**Goal:** Keep business logic independent of frameworks and infra (DB, auth, HTTP), so you can swap them and test easily. [dev](https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi)

### Structure overview

```txt
src/
  core/                    # Pure domain & use‑cases (no Elysia/Drizzle)
    user/
      User.ts
      UserRepository.ts    # port
      CreateUser.ts        # use‑case
      schemas.ts           # Zod
    auth/
      AuthUser.ts
      AuthService.ts       # optional domain service
    shared/
      errors.ts
      Result.ts

  infra/                   # Adapters: DB, HTTP, Auth, etc.
    db/
      drizzle/
        schema/
          user.ts
        drizzleClient.ts
        DrizzleUserRepository.ts
    auth/
      better/
        auth.ts
        betterAuthPlugin.ts
    http/
      elysia/
        routes/
          user.routes.ts
        app.ts

  config/
    env.ts
    di.ts                  # composition root / DI container

  index.ts                 # entrypoint

tests/
  unit/
  integration/
```

### Example: mapping the flow

For “create user”:

- HTTP request → Elysia route (validation, mapping).
- Route calls `CreateUser` use‑case from `core`.
- Use‑case uses `UserRepository` interface (port).
- Drizzle implementation of `UserRepository` lives in `infra/db`.

This mirrors typical clean/hexagonal patterns adapted to TypeScript. [dev](https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi)

---

## 2. Core domain and use‑cases (framework‑agnostic)

**Goal:** Model your business logic in `core` with no references to Elysia, Drizzle, or Better Auth. [dev](https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi)

### Domain entity

```ts
// src/core/user/User.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export type NewUser = Pick<User, 'email' | 'name'>;
```

### Port: repository interface

```ts
// src/core/user/UserRepository.ts
import { User, NewUser } from './User';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
}
```

### Use‑case

```ts
// src/core/user/CreateUser.ts
import { UserRepository } from './UserRepository';
import { NewUser } from './User';
import { createUserSchema, type CreateUserInput } from './schemas';

export class CreateUser {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: CreateUserInput) {
    const data = createUserSchema.parse(input); // domain-level Zod
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new Error('EMAIL_EXISTS');

    const user: NewUser = {
      email: data.email,
      name: data.name,
    };

    return this.repo.create(user);
  }
}
```

This module is reusable in any environment (CLI, workers, HTTP) because it only depends on TypeScript interfaces. [dev](https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi)

---

## 3. Validation: Elysia at the edge, Zod in the core

**Goal:** Let Elysia handle HTTP I/O validation, while Zod is the single source of truth for business invariants and cross‑module DTOs. [elysiajs](https://elysiajs.com/essential/validation)

### Zod schemas (core)

```ts
// src/core/user/schemas.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

These schemas are reused by use‑cases and tests, ensuring constraints live in one place. [github](https://github.com/elysiajs/elysia/issues/11)

### Elysia validation (HTTP layer)

```ts
// src/infra/http/elysia/routes/user.routes.ts
import { Elysia, t } from 'elysia';
import type { AppContainer } from '../../../config/di';
import { createUserSchema } from '../../../core/user/schemas';

export const registerUserRoutes = (app: Elysia<{ container: AppContainer }>) =>
  app.post(
    '/users',
    async ({ body, container }) => {
      const parsed = createUserSchema.parse(body); // extra domain validation
      const user = await container.useCases.createUser.execute(parsed);
      return user;
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        name: t.String({ minLength: 2 }),
      }),
      response: t.Object({
        id: t.String(),
        email: t.String(),
        name: t.String(),
        createdAt: t.String(),
      }),
    }
  );
```

Elysia’s `t.*` gives fast runtime validation, coercion and type inference at the HTTP boundary. [elysiajs](https://elysiajs.com/essential/validation)

---

## 4. Infrastructure: Drizzle + PostgreSQL as adapters

**Goal:** Implement the repository ports using Drizzle, keeping SQL concerns confined to `infra/db`. [elysiatools](https://elysiatools.com/en/samples/drizzle)

### Drizzle client

```ts
// src/infra/db/drizzle/drizzleClient.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, { max: 10 });

export const db = drizzle(client, { schema });
```

### Drizzle schema

```ts
// src/infra/db/drizzle/schema/user.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

Drizzle schemas integrate well with Bun and Elysia; there’s even a dedicated integration section in their docs. [elysiatools](https://elysiatools.com/en/samples/drizzle)

### Repository implementation

```ts
// src/infra/db/drizzle/DrizzleUserRepository.ts
import { eq } from 'drizzle-orm';
import { db } from './drizzleClient';
import { users } from './schema/user';
import type { User, NewUser } from '../../../core/user/User';
import { UserRepository } from '../../../core/user/UserRepository';

export class DrizzleUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row ?? null;
  }

  async create(input: NewUser): Promise<User> {
    const [row] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: input.email,
        name: input.name,
      })
      .returning();
    return row;
  }
}
```

To switch DB (e.g. to Dynamo, Prisma, in‑memory), you only swap this adapter and update DI bindings. [dev](https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi)

---

## 5. Auth: Better Auth as an infra adapter

**Goal:** Use Better Auth for auth flows while keeping your core domain independent of the auth provider. [better-auth](https://www.better-auth.com/docs/integrations/elysia)

### Better Auth setup

```ts
// src/infra/auth/better/auth.ts
import { betterAuth } from 'better-auth'; // or '@better-auth/elysia' helper
import { Pool } from 'pg';

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: { enabled: true },
  // add OAuth providers, hooks, etc.
});
```

Better Auth is open‑source and free; you only pay for infra (DB, mail, hosting), not per‑user. [blog.logrocket](https://blog.logrocket.com/better-auth-authentication/)

### Elysia plugin + macro

```ts
// src/infra/auth/better/betterAuthPlugin.ts
import { Elysia } from 'elysia';
import { auth } from './auth';

export const betterAuthPlugin = new Elysia({ name: 'better-auth' })
  .mount(auth.handler) // exposes /api/auth routes[web:30][web:32]
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });[web:32][web:35]
        if (!session) return status(401);
        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
```

### Protected route example

```ts
// src/infra/http/elysia/routes/me.routes.ts
import { Elysia } from 'elysia';

export const registerMeRoutes = (app: Elysia) =>
  app.get(
    '/me',
    ({ user }) => user, // supplied by Better Auth macro
    { auth: true } // triggers macro resolve
  );
```

This keeps auth logic in `infra/auth`, and your core sees only a simple “current user” or “userId” abstraction if needed. [better-auth](https://www.better-auth.com/docs/integrations/elysia)

---

## 6. Dependency Injection and app wiring

**Goal:** Centralize wiring between ports (core) and adapters (infra) in a simple composition root, making it easy to swap implementations and to spin up different containers (test vs prod). [github](https://github.com/bypepe77/typescript-clean-architecture)

### DI container

```ts
// src/config/di.ts
import { DrizzleUserRepository } from '../infra/db/drizzle/DrizzleUserRepository';
import { CreateUser } from '../core/user/CreateUser';

export function createContainer() {
  // infra
  const userRepo = new DrizzleUserRepository();

  // use-cases
  const createUser = new CreateUser(userRepo);

  return {
    useCases: {
      createUser,
    },
    repos: {
      userRepo,
    },
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
```

### Elysia app wiring

```ts
// src/infra/http/elysia/app.ts
import { Elysia } from 'elysia';
import { betterAuthPlugin } from '../../auth/better/betterAuthPlugin';
import { registerUserRoutes } from './routes/user.routes';
import { registerMeRoutes } from './routes/me.routes';
import type { AppContainer } from '../../../config/di';

export function createApp(container: AppContainer) {
  const app = new Elysia().decorate('container', container).use(betterAuthPlugin);

  registerUserRoutes(app);
  registerMeRoutes(app);

  return app;
}
```

Elysia’s plugin/decorate system is effectively a DI mechanism: dependencies are registered on the app and declared via the context. [nearl.elysiajs](https://nearl.elysiajs.com/essential/plugin)

### Entrypoint

```ts
// src/index.ts
import { createApp } from './infra/http/elysia/app';
import { createContainer } from './config/di';
import './config/env'; // ensure env loaded/validated

const container = createContainer();
const app = createApp(container);

app.listen(3000);
```

---

## 7. Testing: Vitest + Supertest

**Goal:** Fast unit tests for core + integration tests for HTTP, using Vitest and Supertest under Bun. [dev](https://dev.to/kcsujeet/your-tests-are-slow-you-need-to-migrate-to-bun-9hh)

### Unit tests (core only)

```ts
// tests/unit/core/user/CreateUser.test.ts
import { describe, it, expect } from 'vitest';
import { CreateUser } from '../../../src/core/user/CreateUser';
import { UserRepository } from '../../../src/core/user/UserRepository';
import type { User, NewUser } from '../../../src/core/user/User';

class InMemoryUserRepository implements UserRepository {
  private data = new Map<string, User>();

  async findByEmail(email: string) {
    return [...this.data.values()].find(u => u.email === email) ?? null;
  }

  async create(input: NewUser): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name,
      createdAt: new Date(),
    };
    this.data.set(user.id, user);
    return user;
  }
}

describe('CreateUser', () => {
  it('creates a user when email does not exist', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new CreateUser(repo);

    const user = await useCase.execute({ email: 'a@b.com', name: 'John' });

    expect(user.email).toBe('a@b.com');
  });

  it('throws when email already exists', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new CreateUser(repo);

    await useCase.execute({ email: 'a@b.com', name: 'John' });

    await expect(useCase.execute({ email: 'a@b.com', name: 'Jane' })).rejects.toThrow(
      'EMAIL_EXISTS'
    );
  });
});
```

This runs without Bun/Elysia/Drizzle, so it’s extremely fast and stable. [dev](https://dev.to/kcsujeet/your-tests-are-slow-you-need-to-migrate-to-bun-9hh)

### Integration tests (HTTP + DI + validation)

```ts
// tests/integration/http/user.routes.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/infra/http/elysia/app';
import { createContainer } from '../../../src/config/di';

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  const container = createContainer();
  app = createApp(container);
});

describe('User routes', () => {
  it('POST /users creates user', async () => {
    const res = await request(app.server).post('/users').send({ email: 'a@b.com', name: 'John' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@b.com');
  });

  it('POST /users fails on invalid body', async () => {
    const res = await request(app.server).post('/users').send({ email: 'not-an-email', name: 'x' });

    expect(res.status).toBe(400); // Elysia validation error
  });
});
```

Vitest works well on Bun, and Supertest can talk to Elysia’s underlying server instance. [dev](https://dev.to/kcsujeet/your-tests-are-slow-you-need-to-migrate-to-bun-9hh)

---

## 8. Putting it all together

Here’s a concise checklist you can follow when starting a new feature:

1. **Model domain** in `core`:
   - Add entity (e.g. `Post.ts`).
   - Add port (e.g. `PostRepository.ts`).
   - Add Zod schemas for inputs/outputs.
   - Implement use‑cases (e.g. `CreatePost.ts`). [dev](https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi)

2. **Implement infra adapters**:
   - Add Drizzle table in `infra/db/drizzle/schema/post.ts`.
   - Implement `DrizzlePostRepository` satisfying `PostRepository`. [elysiatools](https://elysiatools.com/en/samples/drizzle)

3. **Wire via DI**:
   - Bind repository to use‑case in `config/di.ts`. [github](https://github.com/bypepe77/typescript-clean-architecture)

4. **Expose HTTP endpoints**:
   - Add Elysia route using `t.*` schemas for request/response.
   - Call use‑case from the route; use Zod at domain boundary where needed. [elysiajs](https://elysiajs.com/essential/validation)

5. **Secure with Better Auth if required**:
   - Use `auth: true` macro and read `user` from context, mapping to your core if needed. [better-auth](https://www.better-auth.com/docs/integrations/elysia)

6. **Test**:
   - Add unit tests for use‑cases (Vitest, in‑memory repos).
   - Add integration tests for routes (Vitest + Supertest). [dev](https://dev.to/kcsujeet/your-tests-are-slow-you-need-to-migrate-to-bun-9hh)

If you tell me the first real feature you plan to build (e.g. “projects with members and roles”), I can sketch the concrete `core/`, `infra/`, and test files for that feature following this guide.
