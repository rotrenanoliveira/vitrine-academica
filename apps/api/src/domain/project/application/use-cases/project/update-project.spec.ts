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
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { UpdateProjectUseCase } from './update-project'

let projectsRepository: InMemoryProjectsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: UpdateProjectUseCase

function setupMember(memberStatus: ProjectMemberStatus, projectStatus: ProjectStatus = ProjectStatus.SKETCH) {
  const { project } = makeProject({ status: projectStatus })
  const userId = new UniqueEntityId()
  const { projectMember } = makeProjectMember({ projectId: project.id, userId, status: memberStatus })

  projectsRepository.items.push(project)
  projectMembersRepository.items.push(projectMember)

  return { project, userId }
}

describe('(UC) - Update Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new UpdateProjectUseCase(projectsRepository, registerLog, projectMembersRepository)
  })

  it('deve permitir ao dono atualizar um projeto em rascunho', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      title: 'Novo título',
      description: 'Nova descrição',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.title).toBe('Novo título')
      expect(result.value.project.description).toBe('Nova descrição')
    }
  })

  it('deve registrar um log de auditoria quando o projeto é atualizado', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      title: 'Novo título',
      description: 'Nova descrição',
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('deve permitir ao dono mudar o status para publicado', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      title: project.title,
      description: project.description,
      status: ProjectStatus.PUBLISHED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.status).toBe(ProjectStatus.PUBLISHED)
    }
  })

  it('deve permitir ao dono atualizar um projeto que não é rascunho', async () => {
    const { project } = makeProject({ status: ProjectStatus.SCHEDULED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      title: 'Novo',
      description: 'Novo',
      status: ProjectStatus.PUBLISHED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.title).toBe('Novo')
      expect(result.value.project.status).toBe(ProjectStatus.PUBLISHED)
    }
  })

  it('não deve atualizar um projeto que não existe', async () => {
    const result = await sut.execute({
      projectId: 'projeto-inexistente',
      authorId: new UniqueEntityId().toString(),
      title: 'Título',
      description: 'Descrição',
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve permitir a quem não é dono nem coautor atualizar o projeto', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: new UniqueEntityId().toString(),
      title: 'Alteração indevida',
      description: 'Alteração indevida',
    })

    expect(result.isLeft()).toBeTruthy()
    expect(project.title).not.toBe('Alteração indevida')
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotProjectOwnerError)
    }
  })

  it('deve permitir ao coautor que aceitou o convite editar o título e a descrição', async () => {
    const { project, userId } = setupMember(ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: userId.toString(),
      title: 'Título do coautor',
      description: 'Descrição do coautor',
    })

    expect(result.isRight()).toBeTruthy()
    expect(project.title).toBe('Título do coautor')
    expect(project.description).toBe('Descrição do coautor')
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('deve permitir ao coautor editar os anexos', async () => {
    const { project, userId } = setupMember(ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: userId.toString(),
      title: project.title,
      description: project.description,
      attachments: ['anexo-1', 'anexo-2'],
    })

    expect(result.isRight()).toBeTruthy()
    expect(project.attachments).toEqual(['anexo-1', 'anexo-2'])
  })

  it('deve permitir ao coautor enviar o mesmo status do projeto, sem alterá-lo', async () => {
    const { project, userId } = setupMember(ProjectMemberStatus.ACCEPTED, ProjectStatus.SCHEDULED)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: userId.toString(),
      title: 'Novo título',
      description: 'Nova descrição',
      status: ProjectStatus.SCHEDULED,
    })

    expect(result.isRight()).toBeTruthy()
    expect(project.title).toBe('Novo título')
    expect(project.status).toBe(ProjectStatus.SCHEDULED)
  })

  it.each([ProjectStatus.PUBLISHED, ProjectStatus.SCHEDULED, ProjectStatus.ARCHIVED])(
    'não deve permitir ao coautor mudar o status do projeto para %s',
    async (newStatus) => {
      const { project, userId } = setupMember(ProjectMemberStatus.ACCEPTED)

      const result = await sut.execute({
        projectId: project.id.toString(),
        authorId: userId.toString(),
        title: 'Título que não deve ser gravado',
        description: project.description,
        status: newStatus,
      })

      expect(result.isLeft()).toBeTruthy()
      expect(project.status).toBe(ProjectStatus.SKETCH)
      expect(project.title).not.toBe('Título que não deve ser gravado')
      expect(auditLogsRepository.items).toHaveLength(1)
      expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(NotProjectOwnerError)
      }
    },
  )

  it.each([ProjectMemberStatus.PENDING, ProjectMemberStatus.REJECTED])(
    'não deve permitir a quem tem convite %s editar o projeto',
    async (memberStatus) => {
      const { project, userId } = setupMember(memberStatus)

      const result = await sut.execute({
        projectId: project.id.toString(),
        authorId: userId.toString(),
        title: 'Alteração indevida',
        description: 'Alteração indevida',
      })

      expect(result.isLeft()).toBeTruthy()
      expect(project.title).not.toBe('Alteração indevida')

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(NotProjectOwnerError)
      }
    },
  )
})
