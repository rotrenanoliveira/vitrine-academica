export interface ManagedInstitution {
  id: string
  name: string
  origin: 'SEED' | 'USER_REGISTRATION' | 'ADMIN'
  otherMembersCount: number
  otherManagersCount: number
}

export interface AnonymizeUserParams {
  userId: string
  name: string
  email: string
  institutionIdsToArchive: string[]
}

export interface AccountDeletionRepository {
  findManagedInstitutions(userId: string): Promise<ManagedInstitution[]>

  anonymizeUser(params: AnonymizeUserParams): Promise<void>
}
