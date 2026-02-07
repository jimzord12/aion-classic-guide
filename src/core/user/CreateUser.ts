import { type CreateUserInput, createUserSchema } from './schemas';
import type { NewUser } from './User';
import type { UserRepository } from './UserRepository';

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
