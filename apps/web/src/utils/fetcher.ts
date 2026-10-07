import { HTTPError } from 'ky'
import { notFound } from 'next/navigation'
import z from 'zod'

export const responseError = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export type ResponseError = z.infer<typeof responseError>

/** Fetcher Options */
type FetcherOptions = { throw?: boolean; notFound?: boolean }

/** Handles errors from fetcher function, returns a tuple of [data, error] */
export function fetcher<T>(
  args: Promise<T>,
  options: { throw: false; notFound?: boolean },
): Promise<[T, null] | [null, ResponseError]>
/** Handles errors from fetcher function, throws an error if options.throw is true */
export function fetcher<T>(args: Promise<T>, options: { throw: true; notFound?: boolean }): Promise<T>
/** Handles errors from fetcher function, returns a tuple of [data, error] */
export function fetcher<T>(args: Promise<T>, options?: FetcherOptions): Promise<[T, null] | [null, ResponseError]>

export async function fetcher<T>(
  args: Promise<T>,
  options: FetcherOptions = { throw: false },
): Promise<[T, null] | [null, ResponseError] | T> {
  try {
    const data = await args

    if (options.throw === true) return data as T

    return [data, null]
  } catch (error) {
    // TODO: remove this
    // console.error(error)

    // TODO: handle errors from different sources
    if (error instanceof HTTPError) {
      if (options.throw) throw error

      if (error.response.status === 404 && options.notFound !== false) {
        notFound()
      }

      const data = error.data
      const message =
        typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
          ? data.message
          : undefined

      return [null, { success: false, message: message ?? error.message }]
    }

    if (error instanceof Error) {
      if (options.throw) throw new Error(error.message)

      return [null, { success: false, message: error.message }]
    }

    if (options.throw) throw new Error('Unexpected error, try again in a few minutes.')

    return [null, { success: false, message: 'Unexpected error, try again in a few minutes.' }]
  }
}
