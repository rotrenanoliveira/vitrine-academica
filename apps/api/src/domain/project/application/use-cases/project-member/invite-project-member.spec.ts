import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { CannotInviteProjectOwnerError } from '../../_errors/cannot-invite-project-owner-error'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectMemberAlreadyInvitedError } from '../../_errors/project-member-already-invited-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { InviteProjectMemberUseCase } from './invite-project-member'

let projectsRepository: InMemoryProjectsRepository
let usersRepository: InMemoryUsersRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: InviteProjectMemberUseCase

function setup(projectStatus: ProjectStatus = ProjectStatus.SKETCH) {
  const { user: owner } = makeUser({ status: UserStatus.ACTIVE })
  const { user: guest } = makeUser({ status: UserStatus.ACTIVE })
  const { project } = makeProject({ author: owner.id, status: projectStatus })

  usersRepository.items.push(owner, guest)
  projectsRepository.items.push(project)

  return { owner, guest, project }
}

describe('(UC) - Invite Project Member', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    usersRepository = new InMemoryUsersRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new InviteProjectMemberUseCase(projectsRepository, usersRepository, projectMembersRepository, registerLog)
  })

  it('deve convidar um usuário pelo e-mail, criando um convite pendente', async () => {
    const { owner, guest, project } = setup()

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: owner.id.toString(),
      email: guest.email,
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projectMember.projectId.toString()).toBe(project.id.toString())
      expect(result.value.projectMember.userId.toString()).toBe(guest.id.toString())
      expect(result.value.projectMember.status).toBe(ProjectMemberStatus.PENDING)
    }

    expect(projectMembersRepository.items).toHaveLength(1)
  })

  it('deve registrar um log de auditoria quando o convite é criado', async () => {
    const { owner, guest, project } = setup()

    await sut.execute({
      projectId: project.id.toString(),
      authorId: owner.id.toString(),
      email: guest.email,
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.CREATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
    expect(auditLogsRepository.items[0].resource).toBe('project.member')
  })

  it('não deve convidar para um projeto que não existe', async () => {
    const { owner, guest } = setup()

    const result = await sut.execute({
      projectId: 'projeto-inexistente',
      authorId: owner.id.toString(),
      email: guest.email,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve convidar quando quem convida não é o dono do projeto', async () => {
    const { guest, project } = setup()
    const { user: stranger } = makeUser({ status: UserStatus.ACTIVE })

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: stranger.id.toString(),
      email: guest.email,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(projectMembersRepository.items).toHaveLength(0)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotProjectOwnerError)
    }
  })

  it('não deve convidar para um projeto arquivado', async () => {
    const { owner, guest, project } = setup(ProjectStatus.ARCHIVED)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: owner.id.toString(),
      email: guest.email,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(projectMembersRepository.items).toHaveLength(0)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidProjectStatusError)
    }
  })

  it('não deve convidar um e-mail que não pertence a nenhum usuário', async () => {
    const { owner, project } = setup()

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: owner.id.toString(),
      email: 'ninguem@exemplo.com',
    })

    expect(result.isLeft()).toBeTruthy()
    expect(projectMembersRepository.items).toHaveLength(0)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it.each([UserStatus.INACTIVE, UserStatus.BLOCKED, UserStatus.DELETED, UserStatus.PENDING])(
    'não deve convidar um usuário com status %s',
    async (status) => {
      const { owner, project } = setup()
      const { user: unavailable } = makeUser({ status })
      usersRepository.items.push(unavailable)

      const result = await sut.execute({
        projectId: project.id.toString(),
        authorId: owner.id.toString(),
        email: unavailable.email,
      })

      expect(result.isLeft()).toBeTruthy()
      expect(projectMembersRepository.items).toHaveLength(0)

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UserUnavailableError)
      }
    },
  )

  it('não deve permitir que o dono convide a si mesmo', async () => {
    const { owner, project } = setup()

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: owner.id.toString(),
      email: owner.email,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(projectMembersRepository.items).toHaveLength(0)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CannotInviteProjectOwnerError)
    }
  })

  it.each([ProjectMemberStatus.PENDING, ProjectMemberStatus.ACCEPTED])(
    'não deve convidar quem já tem um convite %s',
    async (status) => {
      const { owner, guest, project } = setup()
      const { projectMember } = makeProjectMember({ projectId: project.id, userId: guest.id, status })
      projectMembersRepository.items.push(projectMember)

      const result = await sut.execute({
        projectId: project.id.toString(),
        authorId: owner.id.toString(),
        email: guest.email,
      })

      expect(result.isLeft()).toBeTruthy()
      expect(projectMembersRepository.items).toHaveLength(1)

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ProjectMemberAlreadyInvitedError)
      }
    },
  )

  it('deve reenviar o convite para quem recusou antes, voltando a pendente', async () => {
    const { owner, guest, project } = setup()
    const { projectMember } = makeProjectMember({
      projectId: project.id,
      userId: guest.id,
      status: ProjectMemberStatus.REJECTED,
    })
    projectMembersRepository.items.push(projectMember)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: owner.id.toString(),
      email: guest.email,
    })

    expect(result.isRight()).toBeTruthy()
    expect(projectMembersRepository.items).toHaveLength(1)
    expect(projectMembersRepository.items[0].status).toBe(ProjectMemberStatus.PENDING)
  })
})
