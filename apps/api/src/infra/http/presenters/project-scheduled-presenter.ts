import type { ProjectScheduled } from '@/domain/project/enterprise/entities/project-scheduled'

export class ProjectScheduledPresenter {
  static toHTTP(projectScheduled: ProjectScheduled) {
    return {
      id: projectScheduled.id.toString(),
      projectId: projectScheduled.projectId.toString(),
      publishedIn: projectScheduled.publishedIn.toISOString(),
      createdAt: projectScheduled.createdAt.toISOString(),
    }
  }
}
