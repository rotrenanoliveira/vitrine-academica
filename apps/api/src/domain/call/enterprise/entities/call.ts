import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum CallStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface CallProps {
  authorId: UniqueEntityId
  title: string
  description: string
  applicationDeadline: Date
  status: CallStatus
  projectId: UniqueEntityId | null
  createdAt: Date
  updatedAt?: Date | null
}

export class Call extends Entity<CallProps> {
  get authorId() {
    return this.props.authorId
  }

  get title() {
    return this.props.title
  }

  set title(title: string) {
    this.props.title = title
    this.touch()
  }

  get description() {
    return this.props.description
  }

  set description(description: string) {
    this.props.description = description
    this.touch()
  }

  get applicationDeadline() {
    return this.props.applicationDeadline
  }

  set applicationDeadline(applicationDeadline: Date) {
    this.props.applicationDeadline = applicationDeadline
    this.touch()
  }

  get status() {
    return this.props.status
  }

  get projectId() {
    return this.props.projectId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  isOpen(): boolean {
    return this.props.status === CallStatus.OPEN
  }

  isExpired(now = new Date()): boolean {
    return now >= this.props.applicationDeadline
  }

  isAcceptingApplications(now = new Date()): boolean {
    return this.isOpen() && !this.isExpired(now)
  }

  close(): void {
    this.props.status = CallStatus.CLOSED
    this.touch()
  }

  linkProject(projectId: UniqueEntityId): void {
    this.props.projectId = projectId
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<CallProps, 'createdAt' | 'status' | 'projectId'>, id?: UniqueEntityId) {
    return new Call(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? CallStatus.OPEN,
        projectId: props.projectId ?? null,
      },
      id,
    )
  }
}
