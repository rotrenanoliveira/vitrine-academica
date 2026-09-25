'use server'

import { clearAccessTokenCookie } from '../auth/cookies'
import { deleteUserAccount, SoleInstitutionManagerHttpError } from '../http/routes/users/delete-user-account'

export async function actionDeleteUserAccount() {
  try {
    const result = await deleteUserAccount()

    await clearAccessTokenCookie()

    return { success: true as const, archivedInstitutions: result.archivedInstitutions }
  } catch (error) {
    if (error instanceof SoleInstitutionManagerHttpError) {
      return { success: false as const, message: error.message, institutions: error.institutions }
    }

    return { success: false as const, message: 'Não foi possível excluir sua conta agora.', institutions: [] }
  }
}
