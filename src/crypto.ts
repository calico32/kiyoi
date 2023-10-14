import * as Iron from 'iron-webcrypto'

let secret = process.env.KIYOI_ENCRYPTION_SECRET
let crypto = globalThis.crypto

/**
 * Sets the encryption secret.
 *
 * @param pw The encryption secret.
 */
export function setEncryptionSecret(pw: string): void {
  secret = pw
}

/**
 * Changes the crypto implementation used for encryption.
 *
 * @param c A webcrypto compatible implementation.
 */
export function setEncryptionCrypto(c: Crypto): void {
  crypto = c
}

/**
 * Encrypts data.
 *
 * `$KIYOI_ENCRYPTION_SECRET` must be set, or `setEncryptionSecret` must be
 * called before calling this function.
 *
 * @param data Serializable data to encrypt.
 * @returns Encrypted data, as Iron formatted string.
 */
export async function encrypt(data: unknown): Promise<string> {
  if (!secret) throw new Error('kiyoi: encryption secret is not set')
  return await Iron.seal(crypto, data, secret, Iron.defaults)
}

/**
 * Decrypts data.
 *
 * `$KIYOI_ENCRYPTION_SECRET` must be set, or `setEncryptionSecret` must be
 * called before calling this function.
 *
 * @param data Encrypted data, as Iron formatted string.
 * @returns Decrypted data.
 */
export async function decrypt(data: string): Promise<unknown> {
  if (!secret) throw new Error('kiyoi: encryption secret is not set')
  return (await Iron.unseal(crypto, data, secret, Iron.defaults)) as unknown
}
