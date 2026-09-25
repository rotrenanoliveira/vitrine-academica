import { HTTPError } from 'ky'
import { api } from '../../api-client'

export interface DeleteUserAccountResponse {
  archivedInstitutions: Array<{
    id: string
    name: string
  }>
}

export class SoleInstitutionManagerHttpError extends Error {
  institutions: Array<{ id: string; name: string }>

  constructor(message: string, institutions: Array<{ id: string; name: string }>) {
    super(message)
    this.institutions = institutions
  }
}

export async function deleteUserAccount(): Promise<DeleteUserAccountResponse> {
  try {
    return await api.delete('api/v1/users/me').json<DeleteUserAccountResponse>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 409) {
      const data = error.data as { message?: string; institutions?: Array<{ id: string; name: string }> } | undefined

      throw new SoleInstitutionManagerHttpError(data?.message ?? error.message, data?.institutions ?? [])
    }

    throw error
  }
}
