import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Slug } from '@/core/entities/value-objects/slug'

export interface TagProps {
  name: string
  slug: Slug
}

export class Tag extends Entity<TagProps> {
  get name(): string {
    return this.props.name
  }

  get slug(): Slug {
    return this.props.slug
  }

  static create(props: TagProps, id?: UniqueEntityId) {
    return new Tag(props, id)
  }
}
