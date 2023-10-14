import { useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable }

type GetFn = (...args: any[]) => any

/**
 * Wrap a server action in a React hook. The action will be called on the server
 * when the hook is rendered, and the result will be cached on the client.
 *
 * ```tsx
 * // api.ts
 * export async function getPosts(): Promise<Post[]> {
 *   const posts = prisma.post.findMany()
 *   return posts
 * }
 *
 * // Posts.tsx
 * 'use client'
 *
 * export function Posts() {
 *   const { data: posts, isLoading, mutate } = use('getPosts', getPosts)
 *   if (isLoading) return <div>Loading...</div>
 *   return (
 *     <div>
 *       <button onClick={() => mutate()}>Refresh</button>
 *       {posts.map(post => <Post key={post.id} post={post} />)}
 *     </div>
 *   )
 * }
 * ```
 */
export function use<T extends GetFn>(
  fnName: string,
  fn: T,
  ...args: Parameters<T>
): SWRResponse<Awaited<ReturnType<T>>, any> {
  const key = useMemo(() => swrKey(fnName, ...args), [fnName, args])
  const swr = useSWR(key, async () => await fn(...args))
  console.log('use', key)
  return swr
}

/**
 * Generate an SWR key from a function name and arguments. The key is used to
 * cache the result of a server action.
 *
 * Trigger a revalidation by calling `mutate`.
 *
 * ```tsx
 * 'use client'
 *
 * function AppBar() {
 *   const { mutate } = useSWRConfig()
 *
 *   return (
 *    <div>
 *      <button onClick={async () => {
 *        await logout()
 *        await mutate('getUser')
 *      }}>
 *        Log out
 *      </button>
 *    </div>
 *   )
 * }
 * ```
 */
export function swrKey(fnName: string, ...args: Serializable[]) {
  if (args.length === 0) return fnName
  return `${fnName}/${args.map((arg) => JSON.stringify(arg)).join(',')}`
}
