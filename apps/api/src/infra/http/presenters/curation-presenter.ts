import type {
  CommunityCurationEntry,
  TeacherCurationEntry,
} from '@/domain/curation/application/repositories/curation-repository'
import { ProjectPresenter } from './project-presenter'

export class CurationPresenter {
  static teacherEntryToHTTP({ project, teacherAverage, teacherRatingsCount }: TeacherCurationEntry) {
    return {
      project: ProjectPresenter.toHTTP(project),
      teacherAverage: Math.round(teacherAverage * 100) / 100,
      teacherRatingsCount,
    }
  }

  static communityEntryToHTTP({ project, weightedScore, starsCount }: CommunityCurationEntry) {
    return {
      project: ProjectPresenter.toHTTP(project),
      weightedScore,
      starsCount,
    }
  }
}
