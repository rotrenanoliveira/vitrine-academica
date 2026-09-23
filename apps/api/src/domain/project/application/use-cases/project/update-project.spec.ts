import { makeProject } from '@tests/factories/make-project'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { UpdateProjectUseCase } from './update-project'

let projectsRepository: InMemoryProjectsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: UpdateProjectUseCase

describe('(UC) - Update Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new UpdateProjectUseCase(projectsRepository, registerLog)
  })

  it('should be able to update a sketch project as owner', async () => {
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

  it('should register an audit log when a project is updated', async () => {
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

  it('should be able to update status to published as owner', async () => {
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

  it('should be able to update a non-sketch project as owner', async () => {
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

  it('should not be able to update a project that does not exist', async () => {
    const result = await sut.execute({
      projectId: 'non-existent',
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

  it('should not be able to update a project as non-owner', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: new UniqueEntityId().toString(),
      title: 'Hack',
      description: 'Hack',
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotProjectOwnerError)
    }
  })
})
