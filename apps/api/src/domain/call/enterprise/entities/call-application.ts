import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum CallApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type CallApplicationDecision = CallApplicationStatus.APPROVED | CallApplicationStatus.REJECTED

export interface CallApplicationProps {
  callId: UniqueEntityId
  applicantId: UniqueEntityId
  message: string | null
  status: CallApplicationStatus
  decidedAt: Date | null
  createdAt: Date
  updatedAt?: Date | null
}

export class CallApplication extends Entity<CallApplicationProps> {
  get callId() {
    return this.props.callId
  }

  get applicantId() {
    return this.props.applicantId
  }

  get message() {
    return this.props.message
  }

  get status() {
    return this.props.status
  }

  get decidedAt() {
    return this.props.decidedAt
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  isPending(): boolean {
    return this.props.status === CallApplicationStatus.PENDING
  }

  approve(now = new Date()): void {
    this.props.status = CallApplicationStatus.APPROVED
    this.props.decidedAt = now
    this.touch()
  }

  reject(now = new Date()): void {
    this.props.status = CallApplicationStatus.REJECTED
    this.props.decidedAt = now
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<CallApplicationProps, 'message' | 'status' | 'decidedAt' | 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    return new CallApplication(
      {
        ...props,
        message: props.message ?? null,
        status: props.status ?? CallApplicationStatus.PENDING,
        decidedAt: props.decidedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
