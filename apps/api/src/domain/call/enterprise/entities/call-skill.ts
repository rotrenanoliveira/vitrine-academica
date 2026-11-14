import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface CallSkillProps {
  callId: UniqueEntityId
  tagId: UniqueEntityId
  description: string | null
}

export class CallSkill extends Entity<CallSkillProps> {
  get callId() {
    return this.props.callId
  }

  get tagId() {
    return this.props.tagId
  }

  get description() {
    return this.props.description
  }

  static create(props: Optional<CallSkillProps, 'description'>, id?: UniqueEntityId) {
    return new CallSkill(
      {
        ...props,
        description: props.description ?? null,
      },
      id,
    )
  }
}
