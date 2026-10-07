import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Slug } from '@/core/entities/value-objects/slug'
import type { Optional } from '@/core/types/optional'

export enum InstitutionType {
  UNIVERSITY = 'UNIVERSITY',
  COLLEGE = 'COLLEGE',
  CENTER = 'CENTER',
  TECHNICAL_COLLEGE = 'TECHNICAL_COLLEGE',
  OTHER = 'OTHER',
}

export enum InstitutionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum InstitutionOrigin {
  SEED = 'SEED',
  USER_REGISTRATION = 'USER_REGISTRATION',
  ADMIN = 'ADMIN',
}

export interface InstitutionProps {
  name: string
  slug: Slug
  type: InstitutionType
  status: InstitutionStatus
  origin: InstitutionOrigin
  description: string
  registerBy: UniqueEntityId
  shouldProof: boolean
  shouldVerify: boolean
  domain?: string
  createdAt: Date
  updatedAt?: Date | null
}

export class Institution extends Entity<InstitutionProps> {
  get name() {
    return this.props.name
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  get slug() {
    return this.props.slug
  }

  get type() {
    return this.props.type
  }

  get status() {
    return this.props.status
  }

  set status(status: InstitutionStatus) {
    this.props.status = status
    this.touch()
  }

  get origin() {
    return this.props.origin
  }

  get description() {
    return this.props.description
  }

  set description(description: string) {
    this.props.description = description
    this.touch()
  }

  get registerBy() {
    return this.props.registerBy
  }

  get shouldProof() {
    return this.props.shouldProof
  }

  set shouldProof(shouldProof: boolean) {
    this.props.shouldProof = shouldProof
    this.touch()
  }

  get shouldVerify() {
    return this.props.shouldVerify
  }

  set shouldVerify(shouldVerify: boolean) {
    this.props.shouldVerify = shouldVerify
    this.touch()
  }

  get domain() {
    return this.props.domain
  }

  set domain(domain: string | undefined) {
    this.props.domain = domain
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

  static create(props: Optional<InstitutionProps, 'createdAt' | 'status'>, id?: UniqueEntityId) {
    return new Institution(
      {
        ...props,
        status: props.status ?? InstitutionStatus.ACTIVE,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
