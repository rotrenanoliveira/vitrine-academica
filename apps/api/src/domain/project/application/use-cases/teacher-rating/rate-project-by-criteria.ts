import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectTeacherRating } from '../../../enterprise/entities/project-teacher-rating'
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

type LogParams = {
  actorId: string
  sessionId: string
  resourceId: string
  action: AuditLogAction
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
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

  private async log({ actorId, sessionId, resourceId, action, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId,
      action,
      resource: 'project.project_teacher_rating',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    projectId,
    teacherId,
    sessionId,
    scores,
  }: RateProjectByCriteriaUseCaseRequest): Promise<RateProjectByCriteriaUseCaseResponse> {
    const user = await this.usersRepository.findById(teacherId)

    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        action: AuditLogAction.CREATE,
        text: `Professor ${teacherId} não está ativo para avaliar o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserNotActiveError())
    }

    const allowed = await canRateAsTeacher(this.institutionMembersRepository, teacherId)

    if (!allowed) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        action: AuditLogAction.CREATE,
        text: `Usuário ${teacherId} sem vínculo de professor ativo tentou avaliar o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new TeacherRatingNotAllowedError())
    }

    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        action: AuditLogAction.CREATE,
        text: `Projeto ${projectId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    if (project.status !== ProjectStatus.PUBLISHED) {
      await this.log({
        actorId: teacherId,
        sessionId,
        resourceId: projectId,
        action: AuditLogAction.CREATE,
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
        action: AuditLogAction.CREATE,
        text: `Professor ${teacherId} tentou avaliar o próprio projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CannotRateOwnProjectError())
    }

    const activeCriteria = await this.ratingCriteriaRepository.findActiveValid()

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

    const overallScore = Math.round((scores.reduce((sum, item) => sum + item.score, 0) / scores.length) * 10) / 10

    const existing = await this.projectTeacherRatingsRepository.findByProjectAndTeacher(projectId, teacherId)

    if (existing) {
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
      action: AuditLogAction.CREATE,
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
