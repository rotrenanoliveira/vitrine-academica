import type { InstitutionMember } from '../../enterprise/entities/institution-member'

export interface InstitutionMembersRepository {
  findById(id: string): Promise<InstitutionMember | null>
  findManyByInstitutionId(institutionId: string): Promise<InstitutionMember[]>
  findManyByUserId(userId: string): Promise<InstitutionMember[]>
  findByInstitutionAndUser(institutionId: string, userId: string): Promise<InstitutionMember | null>

  create(member: InstitutionMember): Promise<void>
  save(member: InstitutionMember): Promise<void>
}
