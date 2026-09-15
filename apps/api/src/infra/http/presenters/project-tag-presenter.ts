import type { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'

export class ProjectTagPresenter {
  static toHTTP(projectTag: ProjectTag) {
    return {
      id: projectTag.id.toString(),
      projectId: projectTag.projectId.toString(),
      tagId: projectTag.tagId.toString(),
    }
  }
}
