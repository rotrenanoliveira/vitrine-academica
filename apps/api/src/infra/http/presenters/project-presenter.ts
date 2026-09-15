import type { Project } from '@/domain/project/enterprise/entities/project'

export class ProjectPresenter {
  static toHTTP(project: Project) {
    return {
      id: project.id.toString(),
      title: project.title,
      description: project.description,
      authorId: project.author.toString(),
      status: project.status,
      attachments: project.attachments,
      tags: project.tags,
      createdAt: project.createdAt.toISOString(),
    }
  }
}
