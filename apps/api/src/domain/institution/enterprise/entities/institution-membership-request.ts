import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum InstitutionMembershipRequestRole {
  STUDENT = 'STUDENT',
  PROFESSOR = 'PROFESSOR',
  TEACHER = 'TEACHER',
  MANAGER = 'MANAGER',
  ADMINISTRATIVE_OFFICE = 'ADMINISTRATIVE_OFFICE',
}

export enum InstitutionMembershipRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface InstitutionMembershipRequestProps {
  institutionId: string
  userId: string
  role: InstitutionMembershipRequestRole
  status: InstitutionMembershipRequestStatus
  proofAttachmentId?: string | null
  createdAt: Date
  updatedAt?: Date | null
}

export class InstitutionMembershipRequest extends Entity<InstitutionMembershipRequestProps> {
  get institutionId() {
    return this.props.institutionId
  }

  get userId() {
    return this.props.userId
  }

  get role() {
    return this.props.role
  }

  get status() {
    return this.props.status
  }

  set status(status: InstitutionMembershipRequestStatus) {
    this.props.status = status
    this.touch()
  }

  get proofAttachmentId() {
    return this.props.proofAttachmentId
  }

  set proofAttachmentId(proofAttachmentId: string | null | undefined) {
    this.props.proofAttachmentId = proofAttachmentId
    this.touch()
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<InstitutionMembershipRequestProps, 'createdAt' | 'status'>, id?: UniqueEntityId) {
    return new InstitutionMembershipRequest(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? InstitutionMembershipRequestStatus.PENDING,
      },
      id,
    )
  }
}
