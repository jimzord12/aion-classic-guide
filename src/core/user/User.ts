export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export type NewUser = Pick<User, 'email' | 'name'>;
