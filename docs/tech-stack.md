# Tech Stack & Architecture

## Tech Stack

| Layer              | Technology         | Purpose                                   |
| ------------------ | ------------------ | ----------------------------------------- |
| **Runtime**        | Bun                | Fast JavaScript runtime & package manager |
| **HTTP Framework** | Elysia             | Type-safe, fast HTTP server               |
| **Database ORM**   | Drizzle            | Type-safe SQL queries                     |
| **Database**       | PostgreSQL         | Relational database                       |
| **Auth**           | Better Auth        | Open-source authentication                |
| **Validation**     | Zod                | Schema validation & inference             |
| **Testing**        | Vitest + Supertest | Fast unit & integration tests             |

---

## Architecture: Clean/Hexagonal

### Core Principle

**Separate business logic from frameworks.** Domain logic lives in `core/` with no dependencies on Elysia, Drizzle, or Better Auth.

### Structure

```
src/
├── core/           # Pure business logic, interfaces only
│   ├── user/
│   │   ├── User.ts (entities)
│   │   ├── UserRepository.ts (port/interface)
│   │   ├── CreateUser.ts (use-case)
│   │   └── schemas.ts (Zod validation)
│   └── shared/
│       └── errors.ts
├── infra/          # Framework adapters
│   ├── db/
│   │   └── drizzle/
│   │       ├── schema/user.ts
│   │       ├── drizzleClient.ts
│   │       └── DrizzleUserRepository.ts (adapter)
│   ├── auth/better/ (Better Auth plugin)
│   └── http/elysia/ (Elysia routes)
├── config/
│   ├── di.ts (dependency injection)
│   └── env.ts
└── index.ts (app entry point)
```

### Flow Example: "Create User"

```
HTTP Request
    ↓
Elysia Route (validation with t.*)
    ↓
CreateUser Use-Case (core logic)
    ↓
UserRepository Interface (port)
    ↓
DrizzleUserRepository (adapter) → PostgreSQL
    ↓
Response
```

---

## Feature Development Workflow

### 1. Model Domain (`core/`)

- Define entity interface (e.g., `User.ts`)
- Define repository port interface (e.g., `UserRepository.ts`)
- Add Zod schemas for inputs
- Write use-case class (pure logic, no frameworks)

### 2. Implement Infra (`infra/`)

- Add Drizzle table schema
- Implement repository adapter satisfying the port interface
- Update DI container to wire them together

### 3. Expose HTTP Endpoints (`infra/http/elysia/`)

- Create route file with Elysia `t.*` validation
- Call use-case from route
- Add `auth: true` macro if protected

### 4. Test

- **Unit tests**: In-memory repository impl + vitest
- **Integration tests**: Full app + Supertest against HTTP

### 5. Deploy

- Environment variables validated at startup
- Elysia listens on configured port
- Better Auth handles `/api/auth/*` routes

---

## Key Decisions

| Decision                           | Rationale                                         |
| ---------------------------------- | ------------------------------------------------- |
| **Core logic in interfaces**       | Swap DB/HTTP/Auth without changing business rules |
| **Zod at domain boundary**         | Single source of truth for validation rules       |
| **Elysia validation at HTTP edge** | Fast runtime coercion + type safety               |
| **DI composition root**            | Easy to inject real/mock deps for tests           |
| **Better Auth infra layer**        | Core remains auth-agnostic; replace if needed     |
| **Vitest + Supertest**             | Fast tests on Bun; no heavy test frameworks       |

---

## Quick Commands

```bash
bun install              # Install dependencies
bun run dev              # Start dev server
bun test                 # Run all tests
bun test --watch        # Watch mode
```

---

## Adding a New Feature: Checklist

- [ ] Create entity + port in `core/<feature>/`
- [ ] Add Zod schemas for domain inputs
- [ ] Write use-case(s) with pure logic
- [ ] Add table schema in `infra/db/drizzle/schema/`
- [ ] Implement adapter in `infra/db/drizzle/`
- [ ] Wire in `config/di.ts`
- [ ] Add Elysia route(s) in `infra/http/elysia/routes/`
- [ ] Write unit tests (in-memory repo)
- [ ] Write integration tests (HTTP + DB)
