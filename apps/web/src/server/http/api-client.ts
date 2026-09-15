import ky from 'ky'
import { getAccessTokenCookie } from '../auth/cookies'

export const api = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        if (request.headers.has('Authorization')) return

        const token = await getAccessTokenCookie()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
  },
})
