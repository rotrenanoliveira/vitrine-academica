import type { InstitutionMembershipRequestItem } from '@/domain/institution/application/use-cases/institution-membership-request/fetch-institution-membership-requests'

export class InstitutionMembershipRequestListItemPresenter {
  static toHTTP({ request, user }: InstitutionMembershipRequestItem) {
    return {
      id: request.id.toString(),
      institutionId: request.institutionId,
      userId: request.userId,
      name: user.name,
      role: request.role,
      status: request.status,
      proofAttachmentId: request.proofAttachmentId ?? null,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt?.toISOString() ?? null,
    }
  }
}
