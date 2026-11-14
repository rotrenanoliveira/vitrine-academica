import type { ProjectRatingCriterionAverage } from '../../enterprise/entities/project-rating'
import type { ProjectTeacherRating } from '../../enterprise/entities/project-teacher-rating'

export interface ProjectTeacherRatingsRepository {
  findById(id: string): Promise<ProjectTeacherRating | null>
  findByProjectAndTeacher(projectId: string, teacherId: string): Promise<ProjectTeacherRating | null>
  findManyByTeacherId(teacherId: string): Promise<ProjectTeacherRating[]>
  findManyByProjectId(projectId: string): Promise<ProjectTeacherRating[]>
  countByProjectId(projectId: string): Promise<number>
  averageOverallByProjectId(projectId: string): Promise<number | null>
  averagesByCriterionForProject(projectId: string): Promise<ProjectRatingCriterionAverage[]>

  create(teacherRating: ProjectTeacherRating): Promise<void>
  save(teacherRating: ProjectTeacherRating): Promise<void>
}
