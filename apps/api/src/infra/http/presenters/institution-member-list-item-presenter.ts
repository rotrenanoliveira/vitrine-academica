import type { InstitutionMemberItem } from '@/domain/institution/application/use-cases/institution-member/fetch-institution-members'

export class InstitutionMemberListItemPresenter {
  static toHTTP({ member, user }: InstitutionMemberItem) {
    return {
      id: member.id.toString(),
      institutionId: member.institutionId,
      userId: member.userId,
      name: user.name,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt?.toISOString() ?? null,
    }
  }
}
