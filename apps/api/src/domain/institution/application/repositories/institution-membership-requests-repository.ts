import type { InstitutionMembershipRequest } from '../../enterprise/entities/institution-membership-request'

export interface InstitutionMembershipRequestsRepository {
  findById(id: string): Promise<InstitutionMembershipRequest | null>
  findManyByInstitutionId(institutionId: string): Promise<InstitutionMembershipRequest[]>
  findPendingByInstitutionAndUser(institutionId: string, userId: string): Promise<InstitutionMembershipRequest | null>

  create(request: InstitutionMembershipRequest): Promise<void>
  save(request: InstitutionMembershipRequest): Promise<void>
}
