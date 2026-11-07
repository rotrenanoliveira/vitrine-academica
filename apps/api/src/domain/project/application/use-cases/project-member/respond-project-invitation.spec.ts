import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { NotInvitedUserError } from '../../_errors/not-invited-user-error'
import { ProjectInvitationAlreadyAnsweredError } from '../../_errors/project-invitation-already-answered-error'
import { ProjectInvitationNotFoundError } from '../../_errors/project-invitation-not-found-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { RespondProjectInvitationUseCase } from './respond-project-invitation'

let projectsRepository: InMemoryProjectsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: RespondProjectInvitationUseCase

// Monta o cenário padrão: um projeto e um convite para uma pessoa
function setup(
  projectStatus: ProjectStatus = ProjectStatus.SKETCH,
  memberStatus: ProjectMemberStatus = ProjectMemberStatus.PENDING,
) {
  const { project } = makeProject({ status: projectStatus })
  const guestId = new UniqueEntityId()
  const { projectMember } = makeProjectMember({ projectId: project.id, userId: guestId, status: memberStatus })

  projectsRepository.items.push(project)
  projectMembersRepository.items.push(projectMember)

  return { project, guestId, projectMember }
}

describe('(UC) - Respond Project Invitation', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new RespondProjectInvitationUseCase(projectsRepository, projectMembersRepository, registerLog)
  })

  it('deve aceitar um convite pendente', async () => {
    const { guestId, projectMember } = setup()

    const result = await sut.execute({
      invitationId: projectMember.id.toString(),
      userId: guestId.toString(),
      status: ProjectMemberStatus.ACCEPTED,
    })

    expect(result.isRight()).toBeTruthy()
    expect(projectMembersRepository.items[0].status).toBe(ProjectMemberStatus.ACCEPTED)
  })

  it('deve recusar um convite pendente', async () => {
    const { guestId, projectMember } = setup()

    const result = await sut.execute({
      invitationId: projectMember.id.toString(),
      userId: guestId.toString(),
      status: ProjectMemberStatus.REJECTED,
    })

    expect(result.isRight()).toBeTruthy()
    expect(projectMembersRepository.items[0].status).toBe(ProjectMemberStatus.REJECTED)
  })

  it('deve registrar um log de auditoria quando o convite é respondido', async () => {
    const { guestId, projectMember } = setup()

    await sut.execute({
      invitationId: projectMember.id.toString(),
      userId: guestId.toString(),
      status: ProjectMemberStatus.ACCEPTED,
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
    expect(auditLogsRepository.items[0].resource).toBe('project.member')
  })

  it('não deve responder a um convite que não existe', async () => {
    const result = await sut.execute({
      invitationId: 'convite-inexistente',
      userId: new UniqueEntityId().toString(),
      status: ProjectMemberStatus.ACCEPTED,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectInvitationNotFoundError)
    }
  })

  it('não deve deixar outra pessoa responder ao convite', async () => {
    const { projectMember } = setup()

    const result = await sut.execute({
      invitationId: projectMember.id.toString(),
      userId: new UniqueEntityId().toString(),
      status: ProjectMemberStatus.ACCEPTED,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(projectMembersRepository.items[0].status).toBe(ProjectMemberStatus.PENDING)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotInvitedUserError)
    }
  })

  it.each([ProjectMemberStatus.ACCEPTED, ProjectMemberStatus.REJECTED])(
    'não deve responder a um convite que já foi %s',
    async (memberStatus) => {
      const { guestId, projectMember } = setup(ProjectStatus.SKETCH, memberStatus)

      const result = await sut.execute({
        invitationId: projectMember.id.toString(),
        userId: guestId.toString(),
        status: ProjectMemberStatus.ACCEPTED,
      })

      expect(result.isLeft()).toBeTruthy()
      expect(projectMembersRepository.items[0].status).toBe(memberStatus)

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ProjectInvitationAlreadyAnsweredError)
      }
    },
  )

  it('não deve responder a um convite de um projeto arquivado', async () => {
    const { guestId, projectMember } = setup(ProjectStatus.ARCHIVED)

    const result = await sut.execute({
      invitationId: projectMember.id.toString(),
      userId: guestId.toString(),
      status: ProjectMemberStatus.ACCEPTED,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(projectMembersRepository.items[0].status).toBe(ProjectMemberStatus.PENDING)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidProjectStatusError)
    }
  })

  it('não deve responder a um convite de um projeto que não existe', async () => {
    const guestId = new UniqueEntityId()
    const { projectMember } = makeProjectMember({ userId: guestId })
    projectMembersRepository.items.push(projectMember)

    const result = await sut.execute({
      invitationId: projectMember.id.toString(),
      userId: guestId.toString(),
      status: ProjectMemberStatus.ACCEPTED,
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
