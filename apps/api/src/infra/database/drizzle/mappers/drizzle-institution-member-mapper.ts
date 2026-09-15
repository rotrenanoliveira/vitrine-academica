import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  InstitutionMember,
  type InstitutionMemberRole,
  type InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import type { institutionMembers } from '../schemas/institution-members'

type DrizzleInstitutionMember = typeof institutionMembers.$inferSelect
type DrizzleInstitutionMemberInsert = typeof institutionMembers.$inferInsert

export class DrizzleInstitutionMemberMapper {
  static toDomain(row: DrizzleInstitutionMember): InstitutionMember {
    return InstitutionMember.create(
      {
        institutionId: row.institutionId,
        userId: row.userId,
        role: row.role as InstitutionMemberRole,
        status: row.status as InstitutionMemberStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(member: InstitutionMember): DrizzleInstitutionMemberInsert {
    return {
      id: member.id.toString(),
      institutionId: member.institutionId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt ?? undefined,
    }
  }
}
