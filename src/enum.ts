type Restricted<Reserved extends string, T extends Record<string, string>> = {
  readonly [K in keyof T]: K extends Reserved ? 'Value already exists in inherited enum' : T[K]
}

/**
 * Constructs an enum.
 *
 * ```ts
 * const Color = Enum({
 *   Red: 'Red',
 *   Green: 'Green',
 *   Blue: 'Blue',
 * })
 * type Color = Enum<typeof Color>
 *
 * const color: Color = Color.Red
 * ```
 */
export function Enum<const T extends Record<string, string>>(values: T): T
/**
 * Constructs an enum that inherits from another enum.
 *
 * ```ts
 * const ActionError = Enum({
 *   ServerError: 'ServerError',
 *   ClientError: 'ClientError',
 * })
 * type ActionError = Enum<typeof ActionError>
 *
 * const RegisterError = Enum(ActionError, {
 *   UsernameTaken: 'UsernameTaken',
 *   EmailTaken: 'EmailTaken',
 *   PasswordMismatch: 'PasswordMismatch',
 * })
 * type RegisterError = Enum<typeof RegisterError>
 *
 * RegisterError.ServerError // 'ServerError'
 * RegisterError.UsernameTaken // 'UsernameTaken'
 * ```
 */
export function Enum<
  const S extends Record<string, string>,
  const T extends Record<string, string>
>(
  inherits: S,
  values: Restricted<Exclude<keyof S, number | symbol>, T>
): {
  readonly [K in keyof S | keyof T]: K extends keyof S ? S[K] : K extends keyof T ? T[K] : never
}
export function Enum(inheritsOrValues: Record<string, string>, values?: Record<string, string>) {
  if (values) {
    return Object.assign({}, inheritsOrValues, values)
  } else {
    return inheritsOrValues
  }
}

export type Enum<T extends Record<string, string>> = T[keyof T]
