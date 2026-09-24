import { api } from '../../api-client'

export interface ExportUserDataResponse {
  user: {
    id: string
    name: string
    email: string
    status: string
  }
  account: {
    id: string
    avatarId: string | null
    createdAt: string
    confirmationAt: string | null
    consentedAt: string | null
    updatedAt: string | null
  } | null
  sessions: Array<{
    id: string
    expiresAt: string
    revokedAt: string | null
  }>
  institutions: Array<{
    institutionId: string
    role: string
    status: string
  }>
  preferences: Array<{
    tagId: string
  }>
  projects: Array<{
    id: string
    title: string
    status: string
  }>
}

export async function exportUserData(): Promise<ExportUserDataResponse> {
  const result = await api.get('api/v1/users/me/export').json<ExportUserDataResponse>()

  return result
}
