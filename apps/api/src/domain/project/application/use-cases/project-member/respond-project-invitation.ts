import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { type ProjectMember, ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { NotInvitedUserError } from '../../_errors/not-invited-user-error'
import { ProjectInvitationAlreadyAnsweredError } from '../../_errors/project-invitation-already-answered-error'
import { ProjectInvitationNotFoundError } from '../../_errors/project-invitation-not-found-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

export type InvitationAnswer = ProjectMemberStatus.ACCEPTED | ProjectMemberStatus.REJECTED

interface RespondProjectInvitationUseCaseRequest {
  invitationId: string
  userId: string
  status: InvitationAnswer
}

type RespondProjectInvitationUseCaseResponse = Either<
  | ProjectInvitationNotFoundError
  | NotInvitedUserError
  | ProjectInvitationAlreadyAnsweredError
  | ProjectNotFoundError
  | InvalidProjectStatusError,
  { projectMember: ProjectMember }
>

export class RespondProjectInvitationUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    invitationId,
    userId,
    status,
  }: RespondProjectInvitationUseCaseRequest): Promise<RespondProjectInvitationUseCaseResponse> {
    const invitationResult = await this.findInvitationOrFail(invitationId, userId)

    if (invitationResult.isLeft()) {
      return left(invitationResult.value)
    }

    const projectMember = invitationResult.value

    const invitationValidationResult = await this.validateInvitation(projectMember, userId)

    if (invitationValidationResult.isLeft()) {
      return left(invitationValidationResult.value)
    }

    const projectResult = await this.findProjectForInvitationOrFail(projectMember, userId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const statusResult = await this.validateProjectStatus(projectResult.value, invitationId, userId)

    if (statusResult.isLeft()) {
      return left(statusResult.value)
    }

    projectMember.status = status

    await this.projectMembersRepository.save(projectMember)

    await this.log({
      actorId: userId,
      resourceId: invitationId,
      text: `Convite ${invitationId} respondido com ${status}.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ projectMember })
  }

  private async log({ actorId, resourceId, text, status, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'project.member',
      resourceId,
      diff: null,
      status,
      text,
    })
  }

  private async findInvitationOrFail(
    invitationId: string,
    userId: string,
  ): Promise<Either<ProjectInvitationNotFoundError, ProjectMember>> {
    const projectMember = await this.projectMembersRepository.findById(invitationId)

    if (!projectMember) {
      await this.log({
        actorId: userId,
        resourceId: invitationId,
        text: `Convite ${invitationId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectInvitationNotFoundError())
    }

    return right(projectMember)
  }

  private async validateInvitation(
    projectMember: ProjectMember,
    userId: string,
  ): Promise<Either<NotInvitedUserError | ProjectInvitationAlreadyAnsweredError, null>> {
    if (projectMember.userId.toString() !== userId) {
      await this.log({
        actorId: userId,
        resourceId: projectMember.id.toString(),
        text: `Usuário ${userId} tentou responder a um convite que não é dele.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotInvitedUserError())
    }

    if (projectMember.status !== ProjectMemberStatus.PENDING) {
      await this.log({
        actorId: userId,
        resourceId: projectMember.id.toString(),
        text: `Convite ${projectMember.id.toString()} já foi respondido.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectInvitationAlreadyAnsweredError())
    }

    return right(null)
  }

  private async findProjectForInvitationOrFail(
    projectMember: ProjectMember,
    userId: string,
  ): Promise<Either<ProjectNotFoundError, Project>> {
    const project = await this.projectsRepository.findById(projectMember.projectId.toString())

    if (!project) {
      await this.log({
        actorId: userId,
        resourceId: projectMember.id.toString(),
        text: `Projeto ${projectMember.projectId.toString()} do convite ${projectMember.id.toString()} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    return right(project)
  }

  private async validateProjectStatus(
    project: Project,
    invitationId: string,
    userId: string,
  ): Promise<Either<InvalidProjectStatusError, null>> {
    if (project.status === ProjectStatus.ARCHIVED) {
      await this.log({
        actorId: userId,
        resourceId: invitationId,
        text: `Projeto ${project.id.toString()} está arquivado e não aceita respostas a convites.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidProjectStatusError('Não é possível responder ao convite de um projeto arquivado'))
    }

    return right(null)
  }
}
