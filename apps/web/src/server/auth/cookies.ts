import { cookies } from 'next/headers'

export const ACCESS_TOKEN_COOKIE = 'access_token'

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7

export async function setAccessTokenCookie(token: string) {
  const cookieStorage = await cookies()

  cookieStorage.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_SECONDS,
  })
}

export async function getAccessTokenCookie() {
  const cookieStorage = await cookies()

  return cookieStorage.get(ACCESS_TOKEN_COOKIE)?.value
}

export async function clearAccessTokenCookie() {
  const cookieStorage = await cookies()

  cookieStorage.delete(ACCESS_TOKEN_COOKIE)
}
