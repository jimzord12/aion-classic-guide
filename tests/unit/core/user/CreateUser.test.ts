import { CreateUser } from '@core/user/CreateUser';
import type { NewUser, User } from '@core/user/User';
import type { UserRepository } from '@core/user/UserRepository';
import { describe, expect, it } from 'vitest';

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
    expect(user.name).toBe('John');
  });

  it('throws when email already exists', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new CreateUser(repo);

    await useCase.execute({ email: 'a@b.com', name: 'John' });

    await expect(useCase.execute({ email: 'a@b.com', name: 'Jane' })).rejects.toThrow(
      'EMAIL_EXISTS'
    );
  });

  it('validates email format', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new CreateUser(repo);

    await expect(useCase.execute({ email: 'invalid-email', name: 'John' })).rejects.toThrow();
  });

  it('validates name length', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new CreateUser(repo);

    await expect(useCase.execute({ email: 'a@b.com', name: 'x' })).rejects.toThrow();
  });
});
