import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum ProjectStatus {
  SKETCH = 'SKETCH',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface ProjectProps {
  title: string
  description: string
  author: UniqueEntityId
  status: ProjectStatus
  attachments: string[]
  tags: string[]
  createdAt: Date
  updatedAt?: Date | null
}

export class Project extends Entity<ProjectProps> {
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

  get author() {
    return this.props.author
  }

  get status() {
    return this.props.status
  }

  set status(status: ProjectStatus) {
    this.props.status = status
    this.touch()
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get attachments() {
    return this.props.attachments
  }

  set attachments(attachments: string[]) {
    this.props.attachments = attachments
    this.touch()
  }

  get tags() {
    return this.props.tags
  }

  set tags(tags: string[]) {
    this.props.tags = tags
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<ProjectProps, 'createdAt' | 'status' | 'attachments' | 'tags'>, id?: UniqueEntityId) {
    return new Project(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? ProjectStatus.SKETCH,
        attachments: props.attachments ?? [],
        tags: props.tags ?? [],
      },
      id,
    )
  }
}
