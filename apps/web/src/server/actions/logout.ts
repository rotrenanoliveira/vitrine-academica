'use server'

import { clearAccessTokenCookie } from '../auth/cookies'
import { logout } from '../http/routes/auth/logout'

export async function actionLogout() {
  await logout()
  await clearAccessTokenCookie()

  return { success: true, message: 'Sessão encerrada.' }
}
