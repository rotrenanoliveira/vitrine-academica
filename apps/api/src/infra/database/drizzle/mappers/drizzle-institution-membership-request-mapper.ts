import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  InstitutionMembershipRequest,
  type InstitutionMembershipRequestRole,
  type InstitutionMembershipRequestStatus,
} from '@/domain/institution/enterprise/entities/institution-membership-request'
import type { institutionMembershipRequests } from '../schemas/institution-membership-requests'

type DrizzleInstitutionMembershipRequest = typeof institutionMembershipRequests.$inferSelect
type DrizzleInstitutionMembershipRequestInsert = typeof institutionMembershipRequests.$inferInsert

export class DrizzleInstitutionMembershipRequestMapper {
  static toDomain(row: DrizzleInstitutionMembershipRequest): InstitutionMembershipRequest {
    return InstitutionMembershipRequest.create(
      {
        institutionId: row.institutionId,
        userId: row.userId,
        role: row.role as InstitutionMembershipRequestRole,
        status: row.status as InstitutionMembershipRequestStatus,
        proofAttachmentId: row.proofAttachmentId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(request: InstitutionMembershipRequest): DrizzleInstitutionMembershipRequestInsert {
    return {
      id: request.id.toString(),
      institutionId: request.institutionId,
      userId: request.userId,
      role: request.role,
      status: request.status,
      proofAttachmentId: request.proofAttachmentId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt ?? undefined,
    }
  }
}
