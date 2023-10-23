import 'client-only'

import useSWR, { SWRResponse, mutate } from 'swr'

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | Serializable[]
  | { [key: string]: Serializable }

export type Action = (...args: any[]) => Promise<any>

export type Actions<T extends { [key: string]: Action }> = {
  [K in keyof T]: T[K] & { key: K }
} & {
  $use: <K extends keyof T>(
    fnName: K,
    ...args: Parameters<T[K]>
  ) => SWRResponse<Awaited<ReturnType<T[K]>>, any>
  $register: <K extends string, A extends Action>(
    fnName: K,
    action: A
  ) => Actions<T & { [key in K]: A }>
  $key(fnName: keyof T, ...args: Serializable[]): string
  $mutate(fnName: keyof T, args: Serializable[], data: any): Promise<any>
}

export function Actions<T extends { [key: string]: Action }>(actions: T): Actions<T> {
  return {
    ...(Object.fromEntries(
      Object.entries(actions).map(([k, fn]) => [k, Object.assign(fn, { key: k })])
    ) as { [K in keyof T]: T[K] & { key: K } }),
    $use(k, ...args) {
      if (typeof k !== 'string') throw new Error('kiyoi: action name must be a string')

      const action = actions[k]

      if (!action) throw new Error(`kiyoi: action "${k}" not found`)

      const { data, error, isLoading, isValidating, mutate } = useSWR(
        swrKey(k, ...args),
        async (arg) => {
          const data = await action(...args)
          console.log('use', k, data)
          return data
        },
        { revalidateOnMount: true }
      )

      return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
      }
    },
    $register(k, fn) {
      if (typeof k !== 'string') throw new Error('kiyoi: action name must be a string')
      if (typeof fn !== 'function') throw new Error('kiyoi: action must be a function')

      return Actions({
        ...actions,
        [k]: fn,
      })
    },
    $key: swrKey,
    async $mutate<K extends keyof T>(
      k: Exclude<K, number | symbol>,
      args: Serializable[],
      data: any
    ) {
      return await mutate(swrKey(k, ...args), data)
    },
  }
}

/**
 * Wrap a server action in a React hook. The action will be called on the server
 * when the hook is rendered, and the result will be cached on the client.
 *
 * ```tsx
 * // posts.ts
 * 'use server'
 * async function getPosts(): Promise<Post[]> {
 *   const posts = prisma.post.findMany()
 *   return posts
 * }
 *
 * // api.ts
 * export const api = Actions({
 *   getPosts,
 * })
 *
 * // Posts.tsx
 * 'use client'
 *
 * export function Posts() {
 *   const { data: posts, isLoading, mutate } = api.use('getPosts')
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
export function use<A extends Action>(
  k: string,
  action: A,
  ...args: Parameters<A>
): SWRResponse<Awaited<ReturnType<A>>, any> {
  if (typeof k !== 'string') throw new Error('kiyoi: action name must be a string')

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey(k, ...args),
    async (arg) => {
      const data = await action(...args)
      console.log('use', arg, data)
      return data
    },
    { revalidateOnMount: true }
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
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
 *        await mutate(swrKey('getUser'))
 *      }}>
 *        Log out
 *      </button>
 *    </div>
 *   )
 * }
 * ```
 */
export function swrKey(fnName: string, ...args: Serializable[]) {
  if (!args.length) return fnName
  return `${fnName}:${JSON.stringify(args)}`
}
