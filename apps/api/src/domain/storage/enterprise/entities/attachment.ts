import { randomUUID } from 'node:crypto'
import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface AttachmentProps {
  storageKey: string
  mimeType: string
  size: number
  name: string
  createdAt: Date
}

export class Attachment extends Entity<AttachmentProps> {
  get storageKey() {
    return this.props.storageKey
  }

  get mimeType() {
    return this.props.mimeType
  }

  get size() {
    return this.props.size
  }

  get name() {
    return this.props.name
  }

  get createdAt() {
    return this.props.createdAt
  }

  static generateStorageKey(name: string, folder: string): string {
    const sanitized = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return `${folder}/${randomUUID()}-${sanitized}`
  }

  static create(props: Optional<AttachmentProps, 'createdAt'>, id?: UniqueEntityId) {
    return new Attachment(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
