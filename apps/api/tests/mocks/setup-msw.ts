import { HttpNetworkFrame } from 'msw/experimental'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

beforeAll(() =>
  server.listen({
    onUnhandledFrame({ frame, defaults }) {
      if (frame instanceof HttpNetworkFrame) {
        const { hostname } = new URL(frame.data.request.url)

        if (hostname === '127.0.0.1' || hostname === 'localhost') {
          return
        }
      }

      defaults.warn()
    },
  }),
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
