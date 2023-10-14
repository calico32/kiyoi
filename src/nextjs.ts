import type { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Merges the cookies from a request and response into a single object. `get`,
 * `getAll`, and `has` will read from the request cookies, while `set` and
 * `delete` will write to the response cookies.
 */
export function mergeCookies(req: NextRequest, res: NextResponse): ResponseCookies {
  return {
    get: req.cookies.get.bind(req.cookies),
    getAll: req.cookies.getAll.bind(req.cookies),
    has: req.cookies.has.bind(req.cookies),

    set: res.cookies.set.bind(res.cookies),
    delete: res.cookies.delete.bind(res.cookies),
  }
}
