import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectScheduled } from '../../../enterprise/entities/project-scheduled'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { InvalidScheduleDateError } from '../../_errors/invalid-schedule-date-error'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectAlreadyScheduledError } from '../../_errors/project-already-scheduled-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectScheduledRepository } from '../../repositories/project-scheduled-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface ScheduleProjectUseCaseRequest {
  projectId: string
  authorId: string
  publishedIn: Date
  now?: Date
}

type ScheduleProjectUseCaseResponse = Either<
  | ProjectNotFoundError
  | NotProjectOwnerError
  | ProjectAlreadyScheduledError
  | InvalidProjectStatusError
  | InvalidScheduleDateError,
  { projectScheduled: ProjectScheduled }
>

export class ScheduleProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectScheduledRepository: ProjectScheduledRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    projectId,
    authorId,
    publishedIn,
    now = new Date(),
  }: ScheduleProjectUseCaseRequest): Promise<ScheduleProjectUseCaseResponse> {
    const projectResult = await this.findProjectOrFail(projectId, authorId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value

    const ownerResult = await this.isProjectOwner(project, authorId)

    if (ownerResult.isLeft()) {
      return left(ownerResult.value)
    }

    const statusResult = await this.validateProjectStatus(project, authorId)

    if (statusResult.isLeft()) {
      return left(statusResult.value)
    }

    const existingSchedule = await this.projectScheduledRepository.findById(projectId)

    const scheduleAllowedResult = await this.canScheduleProject(existingSchedule, publishedIn, now, projectId, authorId)

    if (scheduleAllowedResult.isLeft()) {
      return left(scheduleAllowedResult.value)
    }

    const scheduleResult = await this.scheduleProject(project, existingSchedule, publishedIn, authorId)

    if (scheduleResult.isLeft()) {
      return left(scheduleResult.value)
    }

    return right(scheduleResult.value)
  }

  private async log({
    actorId,
    resourceId,
    text,
    status,
    diff,
    sessionId,
    action = AuditLogAction.CREATE,
  }: LogParams & { action?: AuditLogAction }) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action,
      resource: 'project.scheduled',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findProjectOrFail(projectId: string, authorId: string): Promise<Either<ProjectNotFoundError, Project>> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    return right(project)
  }

  private async isProjectOwner(project: Project, authorId: string): Promise<Either<NotProjectOwnerError, null>> {
    if (project.author.toString() !== authorId) {
      await this.log({
        actorId: authorId,
        resourceId: project.id.toString(),
        text: `Usuário ${authorId} não é dono do projeto ${project.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    return right(null)
  }

  private async validateProjectStatus(
    project: Project,
    authorId: string,
  ): Promise<Either<InvalidProjectStatusError, null>> {
    if (project.status !== ProjectStatus.SKETCH) {
      await this.log({
        actorId: authorId,
        resourceId: project.id.toString(),
        text: `Projeto ${project.id.toString()} não está em rascunho.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidProjectStatusError('Somente projetos em rascunho podem ser agendados'))
    }

    return right(null)
  }

  private async canScheduleProject(
    existingSchedule: ProjectScheduled | null,
    publishedIn: Date,
    now: Date,
    projectId: string,
    authorId: string,
  ): Promise<Either<ProjectAlreadyScheduledError | InvalidScheduleDateError, true>> {
    if (existingSchedule && existingSchedule.publishedIn.getTime() > now.getTime()) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} já está agendado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectAlreadyScheduledError())
    }

    if (publishedIn.getTime() <= now.getTime()) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} não pode ser agendado para ${publishedIn.toISOString()}, que não está no futuro.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidScheduleDateError())
    }

    return right(true)
  }

  private async scheduleProject(
    project: Project,
    existingSchedule: ProjectScheduled | null,
    publishedIn: Date,
    authorId: string,
  ): Promise<ScheduleProjectUseCaseResponse> {
    const projectId = project.id.toString()
    project.status = ProjectStatus.SCHEDULED

    if (existingSchedule) {
      const previousPublishedIn = existingSchedule.publishedIn
      existingSchedule.publishedIn = publishedIn

      await this.projectScheduledRepository.save(existingSchedule)
      await this.projectsRepository.save(project)

      await this.log({
        actorId: authorId,
        resourceId: existingSchedule.id.toString(),
        action: AuditLogAction.UPDATE,
        text: `Projeto ${projectId} reagendado com sucesso com data de publicação ${publishedIn.toISOString()}.`,
        status: AuditLogStatus.SUCCESS,
        diff: {
          publishedIn: { old: previousPublishedIn.toISOString(), new: publishedIn.toISOString() },
        },
      })

      return right({ projectScheduled: existingSchedule })
    }

    const projectScheduled = ProjectScheduled.create({
      projectId: new UniqueEntityId(projectId),
      publishedIn,
    })

    await this.projectScheduledRepository.create(projectScheduled)
    await this.projectsRepository.save(project)

    await this.log({
      actorId: authorId,
      resourceId: projectScheduled.id.toString(),
      text: `Projeto ${projectId} agendado com sucesso com data de publicação ${publishedIn.toISOString()}.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ projectScheduled })
  }
}
