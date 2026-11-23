import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectTeacherRating } from '../../../enterprise/entities/project-teacher-rating'
import type { RatingCriterion } from '../../../enterprise/entities/rating-criterion'
import { TeacherRatingItem } from '../../../enterprise/entities/teacher-rating-item'
import { CannotRateOwnProjectError } from '../../_errors/cannot-rate-own-project-error'
import { CriterionNotActiveError } from '../../_errors/criterion-not-active-error'
import { InvalidCriteriaScoresError } from '../../_errors/invalid-criteria-scores-error'
import { ProjectNotEligibleForRatingError } from '../../_errors/project-not-eligible-for-rating-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { TeacherRatingNotAllowedError } from '../../_errors/teacher-rating-not-allowed-error'
import { UserNotActiveError } from '../../_errors/user-not-active-error'
import { canRateAsTeacher } from '../../helpers/can-rate-as-teacher'
import type { ProjectTeacherRatingsRepository } from '../../repositories/project-teacher-ratings-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'
import type { RatingCriteriaRepository } from '../../repositories/rating-criteria-repository'

interface CriterionScoreInput {
  criterionId: string
  score: number
}

interface RateProjectByCriteriaUseCaseRequest {
  projectId: string
  teacherId: string
  sessionId: string
  scores: CriterionScoreInput[]
}

type RateProjectByCriteriaUseCaseResponse = Either<
  | ProjectNotFoundError
  | ProjectNotEligibleForRatingError
  | CannotRateOwnProjectError
  | UserNotActiveError
  | TeacherRatingNotAllowedError
  | InvalidCriteriaScoresError
  | CriterionNotActiveError,
  { rating: ProjectTeacherRating; created: boolean }
>

export class RateProjectByCriteriaUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectTeacherRatingsRepository: ProjectTeacherRatingsRepository,
    private readonly ratingCriteriaRepository: RatingCriteriaRepository,
    private readonly usersRepository: UsersRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    projectId,
    teacherId,
    sessionId,
    scores,
  }: RateProjectByCriteriaUseCaseRequest): Promise<RateProjectByCriteriaUseCaseResponse> {
    const activeUserResult = await this.assertActiveUser(teacherId, sessionId, projectId)

    if (activeUserResult.isLeft()) {
      return left(activeUserResult.value)
    }

    const allowedResult = await this.validateTeacherRating(teacherId, sessionId, projectId)

    if (allowedResult.isLeft()) {
      return left(allowedResult.value)
    }

    const projectResult = await this.findProjectOrFail(projectId, teacherId, sessionId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value

    const eligibleResult = await this.validateProjectEligibility(project, teacherId, sessionId)

    if (eligibleResult.isLeft()) {
      return left(eligibleResult.value)
    }

    const activeCriteria = await this.ratingCriteriaRepository.findActiveValid()

    const scoresValidation = this.validateRating(scores, activeCriteria)

    if (scoresValidation.isLeft()) {
      return left(scoresValidation.value)
    }

    const overallScore = this.calculateOverallScore(scores)

    const existing = await this.projectTeacherRatingsRepository.findByProjectAndTeacher(projectId, teacherId)

    if (existing) {
      return this.updateExistingRating({
        existing,
        scores,
        overallScore,
        projectId,
        teacherId,
        sessionId,
      })
    }

    return this.createRating({
      projectId,
      teacherId,
      sessionId,
      scores,
      overallScore,
    })
  }

  private async log({
    actorId,
    sessionId,
    resourceId,
    text,
    status,
    diff,
    action = AuditLogAction.CREATE,
  }: LogParams & { action?: AuditLogAction }) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action,
      resource: 'project.project_teacher_rating',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async assertActiveUser(
    teacherId: string,
    sessionId: string,
    projectId: string,
  ): Promise<Either<UserNotActiveError, null>> {
    const user = await this.usersRepository.findById(teacherId)

    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        text: `Professor ${teacherId} não está ativo para avaliar o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserNotActiveError())
    }

    return right(null)
  }

  private async validateTeacherRating(
    teacherId: string,
    sessionId: string,
    projectId: string,
  ): Promise<Either<TeacherRatingNotAllowedError, null>> {
    const allowed = await canRateAsTeacher(this.institutionMembersRepository, teacherId)

    if (!allowed) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        text: `Usuário ${teacherId} sem vínculo de professor ativo tentou avaliar o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new TeacherRatingNotAllowedError())
    }

    return right(null)
  }

  private async findProjectOrFail(
    projectId: string,
    teacherId: string,
    sessionId: string,
  ): Promise<Either<ProjectNotFoundError, Project>> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        text: `Projeto ${projectId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    return right(project)
  }

  private async validateProjectEligibility(
    project: Project,
    teacherId: string,
    sessionId: string,
  ): Promise<Either<ProjectNotEligibleForRatingError | CannotRateOwnProjectError, null>> {
    const projectId = project.id.toString()

    if (project.status !== ProjectStatus.PUBLISHED) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        text: `Projeto ${projectId} não está publicado (status=${project.status}).`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotEligibleForRatingError())
    }

    if (project.author.toString() === teacherId) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        text: `Professor ${teacherId} tentou avaliar o próprio projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CannotRateOwnProjectError())
    }

    return right(null)
  }

  private validateRating(
    scores: CriterionScoreInput[],
    activeCriteria: RatingCriterion[],
  ): Either<InvalidCriteriaScoresError | CriterionNotActiveError, null> {
    if (activeCriteria.length === 0) {
      return left(new CriterionNotActiveError('Não há critérios avaliativos cadastrados'))
    }

    if (scores.length !== activeCriteria.length) {
      return left(
        new InvalidCriteriaScoresError(`Informe exatamente ${activeCriteria.length} notas, uma por critério ativo`),
      )
    }

    const activeIds = new Set(activeCriteria.map((criterion) => criterion.id.toString()))
    const scoreIds = new Set(scores.map((score) => score.criterionId))

    if (scoreIds.size !== activeCriteria.length || [...scoreIds].some((id) => !activeIds.has(id))) {
      return left(new CriterionNotActiveError())
    }

    for (const score of scores) {
      if (typeof score.score !== 'number' || Number.isNaN(score.score) || score.score < 0 || score.score > 10) {
        return left(new InvalidCriteriaScoresError('A nota deve ser entre 0 e 10.'))
      }
    }

    return right(null)
  }

  private calculateOverallScore(scores: CriterionScoreInput[]): number {
    return Math.round((scores.reduce((sum, item) => sum + item.score, 0) / scores.length) * 10) / 10
  }

  private async updateExistingRating({
    existing,
    scores,
    overallScore,
    projectId,
    teacherId,
    sessionId,
  }: {
    existing: ProjectTeacherRating
    scores: CriterionScoreInput[]
    overallScore: number
    projectId: string
    teacherId: string
    sessionId: string
  }): Promise<RateProjectByCriteriaUseCaseResponse> {
    const previousOverall = existing.overallScore
    const items = scores.map((score) => {
      const previousItem = existing.items.find((item) => item.criterionId.toString() === score.criterionId)

      return TeacherRatingItem.create(
        {
          ratingId: existing.id,
          criterionId: new UniqueEntityId(score.criterionId),
          score: score.score,
        },
        previousItem?.id,
      )
    })

    existing.updateScores(items, overallScore)

    await this.projectTeacherRatingsRepository.save(existing)

    await this.log({
      actorId: teacherId,
      sessionId,
      resourceId: existing.id.toString(),
      action: AuditLogAction.UPDATE,
      text: `Avaliação atualizada no projeto ${projectId} pelo professor ${teacherId}.`,
      status: AuditLogStatus.SUCCESS,
      diff: {
        overallScore: { old: previousOverall, new: overallScore },
        scores: { old: null, new: scores },
      },
    })

    return right({ rating: existing, created: false })
  }

  private async createRating({
    projectId,
    teacherId,
    sessionId,
    scores,
    overallScore,
  }: {
    projectId: string
    teacherId: string
    sessionId: string
    scores: CriterionScoreInput[]
    overallScore: number
  }): Promise<RateProjectByCriteriaUseCaseResponse> {
    const ratingId = new UniqueEntityId()

    const items = scores.map((score) =>
      TeacherRatingItem.create({
        ratingId,
        criterionId: new UniqueEntityId(score.criterionId),
        score: score.score,
      }),
    )

    const rating = ProjectTeacherRating.create(
      {
        projectId: new UniqueEntityId(projectId),
        teacherId: new UniqueEntityId(teacherId),
        overallScore,
        items,
      },
      ratingId,
    )

    await this.projectTeacherRatingsRepository.create(rating)

    await this.log({
      actorId: teacherId,
      sessionId,
      resourceId: rating.id.toString(),
      text: `Avaliação criada no projeto ${projectId} pelo professor ${teacherId}.`,
      status: AuditLogStatus.SUCCESS,
      diff: {
        projectId: { old: null, new: projectId },
        teacherId: { old: null, new: teacherId },
        overallScore: { old: null, new: overallScore },
        scores: { old: null, new: scores },
      },
    })

    return right({ rating, created: true })
  }
}
