import type { Project } from '@/domain/project/enterprise/entities/project'

export class ProjectPresenter {
  static toHTTP(project: Project) {
    return {
      id: project.id.toString(),
      title: project.title,
      slug: project.slug,
      description: project.description,
      authorId: project.author.toString(),
      status: project.status,
      coverUrl: project.coverUrl,
      attachments: project.attachments,
      tags: project.tags,
      createdAt: project.createdAt.toISOString(),
    }
  }

  static toHTTPListItem(project: Project, coverUrl: string | null, tagNames: string[]) {
    return {
      id: project.id.toString(),
      title: project.title,
      description: project.description,
      coverUrl,
      createdAt: project.createdAt.toISOString(),
      tags: tagNames,
    }
  }
}
