import * as Iron from 'iron-webcrypto'
import { nanoid } from 'nanoid'
import type {
  RequestCookie,
  ResponseCookie,
  ResponseCookies,
} from 'next/dist/compiled/@edge-runtime/cookies'
import { Enum } from './enum.js'
import { Result } from './result.js'

let sessionName = 'session'

let sessionSecret = process.env.KIYOI_SESSION_SECRET

/**
 * Sets the session secret.
 */
export function setSessionSecret(pw: string): void {
  sessionSecret = pw
}

type Intersect<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never

/**
 * Any valid session data.
 */
export type SessionData = { [key: string]: any }

/**
 * A session. The `id` property is always present, and is a unique identifier
 * for the session.
 */
export type Session<T extends SessionData> = T & {
  id: string
}

export type GetCookieStore = {
  get(
    ...args: [key: string] | [options: RequestCookie | ResponseCookies]
  ): ResponseCookie | RequestCookie | undefined
}

/**
 * A session plugin. Plugins can be used to add additional data to a session, or
 * to add validation logic.
 */
export type SessionPlugin<T extends SessionData = SessionData> = {
  create?(session: Session<T>): Session<T>
  validate?(session: Session<T>): boolean
  touch?(session: Session<T>): Session<T>
}

export const SessionError = Enum({
  NoCookie: 'NoCookie',
  InvalidCookie: 'InvalidCookie',
  ValidationFailed: 'ValidationFailed',
})
export type SessionError = Enum<typeof SessionError>

/**
 * The session module. Contains functions for creating, validating, and
 * manipulating sessions.
 */
export const Session = {
  _validators: new Map<string, (session: Session<any>) => boolean>(),
  _touchListeners: new Map<string, (session: Session<any>) => Session<any>>(),
  crypto,

  /**
   * Generates a new session id.
   */
  id() {
    return nanoid()
  },

  /**
   * Get a session from a cookie store. Returns an error if the cookie is
   * missing, invalid, or fails validation.
   *
   * `$KIYOI_SESSION_SECRET` must be set, or `setSessionSecret` must be called
   * before calling this function.
   */
  async get<T extends SessionData>(
    cookieStore: GetCookieStore
  ): Result.Async<Session<T>, SessionError> {
    if (!sessionSecret) throw new Error('kiyoi: session secret is not set')

    const cookie = cookieStore.get(sessionName)
    if (!cookie) return Result.error(SessionError.NoCookie)

    try {
      const session = (await Iron.unseal(
        this.crypto,
        cookie.value,
        sessionSecret,
        Iron.defaults
      )) as Session<T>
      if (!Session.validate(session)) {
        return Result.error(SessionError.ValidationFailed)
      }
      return Result.ok(session)
    } catch {
      return Result.error(SessionError.InvalidCookie)
    }
  },

  /**
   * Saves a session to a cookie store.
   *
   * `$KIYOI_SESSION_SECRET` must be set, or `setSessionSecret` must be called
   * before calling this function.
   */
  async save<T extends SessionData>(session: Session<T>, cookieStore: ResponseCookies) {
    if (!sessionSecret) throw new Error('kiyoi: session secret is not set')

    const sealed = await Iron.seal(this.crypto, session, sessionSecret, Iron.defaults)
    cookieStore.set(sessionName, sealed, {
      maxAge: session.expires - Date.now(),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  },

  /**
   * Destroys a session by deleting its cookie.
   */
  destroy(cookieStore: ResponseCookies) {
    cookieStore.delete(sessionName)
  },

  /**
   * Creates a new session from the given data and plugins.
   */
  create<
    T extends SessionData,
    E extends SessionPlugin,
    C = T & Intersect<E extends SessionPlugin<infer U> ? U : never>
  >(sessionData: T, extensions: E[] = []): Session<{ [K in keyof C]: C[K] }> {
    let session: Session<any> = {
      id: Session.id(),
      ...sessionData,
    }

    for (const extension of extensions) {
      if (extension.create) session = extension.create(session)
    }

    return session
  },

  /**
   * Validates a session by running it through all registered validators.
   */
  validate<T extends SessionData>(session: Session<T>): boolean {
    for (const validator of Session._validators.values()) {
      if (!validator(session)) return false
    }
    return true
  },

  /**
   * Touches a session by running it through all registered updaters.
   */
  touch<T extends SessionData>(session: Session<T>): Session<T> {
    for (const toucher of Session._touchListeners.values()) {
      toucher(session)
    }
    return session
  },

  /**
   * Registers a validator function. Validator functions are run when a session
   * is validated.
   *
   * @returns A unique ID for the validator, which can be used to remove it
   * later.
   */
  onValidate<T extends SessionData>(fn: (session: Session<T>) => boolean): string {
    const id = nanoid()
    Session._validators.set(id, fn)
    return 'v,' + id
  },

  /**
   * Registers a touch listener function. Touch listeners are run when
   * `Session.touch` is called.
   *
   * @returns A unique ID for the touch listener, which can be used to remove it
   * later.
   */
  onTouch<T extends SessionData>(fn: (session: Session<T>) => Session<T>): string {
    const id = nanoid()
    Session._touchListeners.set(id, fn)
    return 't,' + id
  },

  /**
   * Removes a validator or touch listener.
   */
  removeListener(id: string) {
    if (id.startsWith('v,')) {
      Session._validators.delete(id.slice(2))
    } else if (id.startsWith('t,')) {
      Session._touchListeners.delete(id.slice(2))
    }
  },

  /**
   * Sets the crypto implementation used for encryption.
   *
   * @param crypto A webcrypto compatible implementation.
   */
  setCrypto(crypto: Crypto) {
    this.crypto = crypto
  },
}

export function expires(seconds: number): SessionPlugin<{ expires: number }> {
  return {
    create(session) {
      session.expires = Date.now() + seconds * 1000
      return session
    },
    validate(session) {
      return session.expires > Date.now()
    },
  }
}

export function idle(seconds: number): SessionPlugin<{ lastActive: number }> {
  return {
    create(session) {
      session.lastActive = Date.now()
      return session
    },
    validate(session) {
      return session.lastActive + seconds * 1000 > Date.now()
    },
    touch(session) {
      session.lastActive = Date.now()
      return session
    },
  }
}
