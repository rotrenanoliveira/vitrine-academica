import type { InstitutionMembershipRequest } from '@/domain/institution/enterprise/entities/institution-membership-request'

export class InstitutionMembershipRequestPresenter {
  static toHTTP(request: InstitutionMembershipRequest) {
    return {
      id: request.id.toString(),
      institutionId: request.institutionId,
      userId: request.userId,
      role: request.role,
      status: request.status,
      proofAttachmentId: request.proofAttachmentId ?? null,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt?.toISOString() ?? null,
    }
  }
}
