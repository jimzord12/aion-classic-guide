import { CreateUser } from '@core/user/CreateUser';
import { DrizzleUserRepository } from '@infra/db/drizzle/DrizzleUserRepository';

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
