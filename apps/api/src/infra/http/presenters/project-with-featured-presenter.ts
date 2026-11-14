import type { Project } from '@/domain/project/enterprise/entities/project'
import { ProjectPresenter } from './project-presenter'

export class ProjectWithFeaturedPresenter {
  static toHTTP(project: Project, featured: boolean) {
    return {
      ...ProjectPresenter.toHTTP(project),
      featured,
    }
  }
}
