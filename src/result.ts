/**
 * A wrapper type for possible errors.
 *
 * ```ts
 * function mayFail(): Result<string, Error> {
 *   try {
 *     if (Math.random() < 0.5) throw new Error('something went wrong')
 *     return Result.ok('the quick brown fox')
 *   } catch (error) {
 *     return Result.error(error)
 *   }
 * }
 *
 * const result = mayFail()
 * if (!result.ok) {
 *   console.error(result.error)
 *   return
 * }
 *
 * console.log(result.value)
 * ```
 */
type Result<T = void, E = never> = { ok: true; value: T } | { ok: false; error: E }

/**
 * Constructs an error result.
 *
 * ```ts
 * const result = Result.error('this is an error')
 * result.ok // false
 * result.error // 'this is an error'
 * ```
 */
export function error<E>(error: E): Result<any, E>
/**
 * Constructs an empty error result.
 *
 * ```ts
 * const result = Result.error()
 * result.ok // false
 * result.error // undefined
 * ```
 */
export function error(): Result<any, undefined>
export function error<E>(error?: E): Result<any, E | undefined> {
  return { ok: false, error: error }
}

/**
 * Constructs an ok result.
 *
 * ```ts
 * const result = Result.ok('this is ok')
 * result.ok // true
 * result.value // 'this is ok'
 * ```
 */
export function ok<T>(value: T): Result<T, never>
/**
 * Constructs an empty ok result.
 *
 * ```ts
 * const result = Result.ok()
 * result.ok // true
 * result.value // undefined
 * ```
 */
export function ok(): Result<void, never>
export function ok<T>(value?: T): Result<T | undefined, any> {
  return { ok: true, value: value }
}

export interface ResultType {
  <T, E>(value: Result<T, E>): ResultMatcher<T, E>
  ok: typeof ok
  error: typeof error
}

/**
 * Matchers for result values.
 */
export interface ResultMatcher<T, E> {
  /**
   * Unwraps the result value, throwing an error if the result is an error.
   */
  unwrap(): T
  /**
   * Unwraps the result value, throwing an error with a custom message if the
   * result is an error.
   */
  expect(message: string): T
  /**
   * Unwraps the result error, throwing an error if the result is not an error.
   */
  unwrapError(): E
  /**
   * Returns the result value if it is ok, or the given value if it is an error.
   */
  unwrapOr<U>(value: U): T | U
  /**
   * Returns the result value if it is ok, or undefined if it is an error.
   */
  ok(): T | undefined
  /**
   * Executes the given function if the result is ok.
   */
  ok(fn: (value: T) => void): void
  /**
   * Returns the result error if it is an error, or undefined if it is ok.
   */
  error(): E | undefined
  /**
   * Executes the given function if the result is an error.
   */
  error(fn: (error: E) => void): void
}

const Result: ResultType = Object.assign(
  <T, E>(result: Result<T, E>) => ({
    unwrap() {
      if (result.ok) return result.value
      throw result.error
    },
    expect(message: string) {
      if (result.ok) return result.value
      throw new Error(`${message}: ${result.error}`)
    },
    unwrapError() {
      if (!result.ok) return result.error
      throw result.value
    },
    unwrapOr: <V>(value: V) => (result.ok ? result.value : value),
    isOk: () => result.ok,
    isError: () => !result.ok,
    ok(fn?: (value: T) => void) {
      if (result.ok && fn) fn(result.value)
      return result.ok ? result.value : undefined
    },
    error(fn?: (error: E) => void) {
      if (!result.ok && fn) fn(result.error)
      return !result.ok ? result.error : undefined
    },
  }),
  { ok, error }
)

namespace Result {
  /**
   * A result with a promise around it.
   */
  export type Async<T = void, E = never> = Promise<Result<T, E>>
}

export { Result }
