import { redirect } from 'next/navigation'
import { getMe } from '../http/routes/auth/get-me'
import { clearAccessTokenCookie, getAccessTokenCookie } from './cookies'

export async function getCurrentUser() {
  const token = await getAccessTokenCookie()

  if (!token) return null

  const [data, error] = await getMe()
  if (error || !data) {
    await clearAccessTokenCookie()
    return null
  }

  return data.user
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) redirect('/sign-in')

  return user
}
