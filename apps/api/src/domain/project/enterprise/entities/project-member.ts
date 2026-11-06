import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum ProjectMemberStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface ProjectMemberProps {
  projectId: UniqueEntityId
  userId: UniqueEntityId
  status: ProjectMemberStatus
  createdAt: Date
  updatedAt?: Date | null
}

export class ProjectMember extends Entity<ProjectMemberProps> {
  get projectId() {
    return this.props.projectId
  }

  get userId() {
    return this.props.userId
  }

  get status() {
    return this.props.status
  }

  set status(status: ProjectMemberStatus) {
    this.props.status = status
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

  static create(props: Optional<ProjectMemberProps, 'createdAt' | 'status'>, id?: UniqueEntityId) {
    return new ProjectMember(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? ProjectMemberStatus.PENDING,
      },
      id,
    )
  }
}
