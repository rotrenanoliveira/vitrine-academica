import type { InstitutionMember } from '@/domain/institution/enterprise/entities/institution-member'

export class InstitutionMemberPresenter {
  static toHTTP(member: InstitutionMember) {
    return {
      id: member.id.toString(),
      institutionId: member.institutionId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt?.toISOString() ?? null,
    }
  }
}
