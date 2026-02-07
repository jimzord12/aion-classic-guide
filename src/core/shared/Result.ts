export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly kind = 'success';
  constructor(readonly value: T) {}
}

export class Failure<E> {
  readonly kind = 'failure';
  constructor(readonly error: E) {}
}

export const success = <T>(value: T): Result<T> => new Success(value);
export const failure = <E>(error: E): Result<never, E> => new Failure(error);
