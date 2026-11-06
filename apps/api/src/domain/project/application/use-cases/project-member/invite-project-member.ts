import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMember, ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { CannotInviteProjectOwnerError } from '../../_errors/cannot-invite-project-owner-error'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectMemberAlreadyInvitedError } from '../../_errors/project-member-already-invited-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface InviteProjectMemberUseCaseRequest {
  projectId: string
  authorId: string
  email: string
}

type LogParams = {
  actorId: string
  resourceId: string
  action?: AuditLogAction
  text: string
  status: AuditLogStatus
}

type InviteProjectMemberUseCaseResponse = Either<
  | ProjectNotFoundError
  | NotProjectOwnerError
  | InvalidProjectStatusError
  | UserNotFoundError
  | UserUnavailableError
  | CannotInviteProjectOwnerError
  | ProjectMemberAlreadyInvitedError,
  { projectMember: ProjectMember }
>

export class InviteProjectMemberUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, action = AuditLogAction.CREATE, text, status }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action,
      resource: 'project.member',
      resourceId,
      diff: null,
      status,
      text,
    })
  }

  async execute({
    projectId,
    authorId,
    email,
  }: InviteProjectMemberUseCaseRequest): Promise<InviteProjectMemberUseCaseResponse> {
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

    if (project.author.toString() !== authorId) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Usuário ${authorId} não é dono do projeto ${projectId} e não pode convidar membros.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    if (project.status === ProjectStatus.ARCHIVED) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} está arquivado e não aceita novos membros.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidProjectStatusError('Não é possível convidar membros para um projeto arquivado'))
    }

    const user = await this.usersRepository.findByEmail(email)

    if (!user) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Nenhum usuário encontrado para o e-mail ${email}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserNotFoundError())
    }

    if (user.status !== UserStatus.ACTIVE) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Usuário ${user.id.toString()} está indisponível para ser convidado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserUnavailableError('Usuário indisponível para ser convidado'))
    }

    if (user.id.toString() === project.author.toString()) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `O dono do projeto ${projectId} tentou convidar a si mesmo.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CannotInviteProjectOwnerError())
    }

    const existingMember = await this.projectMembersRepository.findByProjectAndUser(projectId, user.id.toString())

    if (existingMember) {
  
      if (existingMember.status === ProjectMemberStatus.REJECTED) {
        existingMember.status = ProjectMemberStatus.PENDING
        await this.projectMembersRepository.save(existingMember)

        await this.log({
          actorId: authorId,
          resourceId: existingMember.id.toString(),
          action: AuditLogAction.UPDATE,
          text: `Convite reenviado ao usuário ${user.id.toString()} para o projeto ${projectId}.`,
          status: AuditLogStatus.SUCCESS,
        })

        return right({ projectMember: existingMember })
      }

      await this.log({
        actorId: authorId,
        resourceId: existingMember.id.toString(),
        text: `Usuário ${user.id.toString()} já tem um convite para o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectMemberAlreadyInvitedError())
    }

    const projectMember = ProjectMember.create({
      projectId: project.id,
      userId: user.id,
    })

    await this.projectMembersRepository.create(projectMember)

    await this.log({
      actorId: authorId,
      resourceId: projectMember.id.toString(),
      text: `Usuário ${user.id.toString()} convidado para o projeto ${projectId}.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ projectMember })
  }
}