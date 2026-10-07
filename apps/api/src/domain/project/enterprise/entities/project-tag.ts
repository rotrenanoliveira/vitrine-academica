import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface ProjectTagProps {
  projectId: UniqueEntityId
  tagId: UniqueEntityId
}

export class ProjectTag extends Entity<ProjectTagProps> {
  get projectId() {
    return this.props.projectId
  }

  get tagId() {
    return this.props.tagId
  }

  static create(props: ProjectTagProps, id?: UniqueEntityId) {
    return new ProjectTag(props, id)
  }
}
