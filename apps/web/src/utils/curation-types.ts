import type { Project } from '@/utils/type'

export interface TeacherCurationEntry {
  project: Project
  teacherAverage: number
  teacherRatingsCount: number
}

export interface CommunityCurationEntry {
  project: Project
  weightedScore: number
  starsCount: number
}

export interface Curation {
  board: TeacherCurationEntry[]
  community: CommunityCurationEntry[]
}
