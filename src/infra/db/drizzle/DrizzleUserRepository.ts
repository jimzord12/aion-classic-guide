import type { NewUser, User } from '@core/user/User';
import type { UserRepository } from '@core/user/UserRepository';
import { eq } from 'drizzle-orm';
import { db } from './drizzleClient';
import { users } from './schema/user';

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
    return row ?? ({} as User);
  }
}
