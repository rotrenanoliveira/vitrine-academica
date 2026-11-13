import type { CallWithSkills } from '@/domain/call/application/dtos/call-with-skills'
import type { Call } from '@/domain/call/enterprise/entities/call'
import type { CallSkill } from '@/domain/call/enterprise/entities/call-skill'

export class CallPresenter {
  static toHTTP(call: Call) {
    return {
      id: call.id.toString(),
      authorId: call.authorId.toString(),
      title: call.title,
      description: call.description,
      applicationDeadline: call.applicationDeadline.toISOString(),
      status: call.status,
      projectId: call.projectId?.toString() ?? null,
      createdAt: call.createdAt.toISOString(),
      updatedAt: call.updatedAt?.toISOString() ?? null,
    }
  }

  static skillToHTTP(skill: CallSkill) {
    return {
      id: skill.id.toString(),
      tagId: skill.tagId.toString(),
      description: skill.description,
    }
  }

  static toHTTPWithSkills({ call, skills }: CallWithSkills) {
    return {
      ...CallPresenter.toHTTP(call),
      skills: skills.map(CallPresenter.skillToHTTP),
    }
  }

  static toHTTPListItem(call: Call, skills: string[], projectSlug: string | null) {
    return {
      id: call.id.toString(),
      authorId: call.authorId.toString(),
      title: call.title,
      description: call.description,
      applicationDeadline: call.applicationDeadline.toISOString(),
      status: call.status,
      projectSlug,
      skills,
    }
  }
}
