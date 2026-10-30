import type { ProjectTeacherRatingsRepository } from '@/domain/project/application/repositories/project-teacher-ratings-repository'
import type { ProjectRatingCriterionAverage } from '@/domain/project/enterprise/entities/project-rating'
import type { ProjectTeacherRating } from '@/domain/project/enterprise/entities/project-teacher-rating'

export class InMemoryProjectTeacherRatingsRepository implements ProjectTeacherRatingsRepository {
  public items: ProjectTeacherRating[] = []
  public criterionNames = new Map<string, string>()

  async findById(id: string): Promise<ProjectTeacherRating | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByProjectAndTeacher(projectId: string, teacherId: string): Promise<ProjectTeacherRating | null> {
    return (
      this.items.find((item) => item.projectId.toString() === projectId && item.teacherId.toString() === teacherId) ??
      null
    )
  }

  async findManyByTeacherId(teacherId: string): Promise<ProjectTeacherRating[]> {
    return this.items
      .filter((item) => item.teacherId.toString() === teacherId)
      .sort((a, b) => b.ratedAt.getTime() - a.ratedAt.getTime())
  }

  async findManyByProjectId(projectId: string): Promise<ProjectTeacherRating[]> {
    return this.items.filter((item) => item.projectId.toString() === projectId)
  }

  async countByProjectId(projectId: string): Promise<number> {
    return this.items.filter((item) => item.projectId.toString() === projectId).length
  }

  async averageOverallByProjectId(projectId: string): Promise<number | null> {
    const ratings = this.items.filter((item) => item.projectId.toString() === projectId)

    if (ratings.length === 0) {
      return null
    }

    const sum = ratings.reduce((acc, item) => acc + item.overallScore, 0)
    return Math.round((sum / ratings.length) * 10) / 10
  }

  async averagesByCriterionForProject(projectId: string): Promise<ProjectRatingCriterionAverage[]> {
    const ratings = this.items.filter((item) => item.projectId.toString() === projectId)
    const scoresByCriterion = new Map<string, number[]>()

    for (const rating of ratings) {
      for (const item of rating.items) {
        const criterionId = item.criterionId.toString()
        const scores = scoresByCriterion.get(criterionId) ?? []
        scores.push(item.score)
        scoresByCriterion.set(criterionId, scores)
      }
    }

    return Array.from(scoresByCriterion.entries()).map(([criterionId, scores]) => ({
      criterionId,
      criterionName: this.criterionNames.get(criterionId) ?? criterionId,
      average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }))
  }

  async create(teacherRating: ProjectTeacherRating): Promise<void> {
    this.items.push(teacherRating)
  }

  async save(teacherRating: ProjectTeacherRating): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === teacherRating.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = teacherRating
  }
}
