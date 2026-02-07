import { createContainer } from '@config/di';
import { createApp } from '@infra/http/elysia/app';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  const container = createContainer();
  app = createApp(container);
});

describe('User routes', () => {
  it('POST /users creates user', async () => {
    const res = await request(app as any)
      .post('/users')
      .send({ email: 'test@example.com', name: 'John Doe' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.name).toBe('John Doe');
  });

  it('POST /users fails on invalid email format', async () => {
    const res = await request(app as any)
      .post('/users')
      .send({ email: 'not-an-email', name: 'John' });

    expect(res.status).toBe(400);
  });

  it('POST /users fails on short name', async () => {
    const res = await request(app as any)
      .post('/users')
      .send({ email: 'test@example.com', name: 'x' });

    expect(res.status).toBe(400);
  });
});
