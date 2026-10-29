import type { FetchScheduledProject } from '@/domain/project/application/use-cases/scheduled-project/fetch-scheduled-projects'
import { ProjectPresenter } from './project-presenter'

export class FetchScheduledProjectPresenter {
  static toHTTP({ project, publishedIn }: FetchScheduledProject) {
    return {
      project: ProjectPresenter.toHTTP(project),
      publishedIn: publishedIn.toISOString(),
    }
  }
}
