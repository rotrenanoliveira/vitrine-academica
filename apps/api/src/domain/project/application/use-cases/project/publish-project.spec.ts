import { makeProject } from '@tests/factories/make-project'
import { makeProjectScheduled } from '@tests/factories/make-project-scheduled'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectScheduledRepository } from '@tests/repositories/in-memory-project-scheduled-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { PublishProjectUseCase } from './publish-project'

let projectsRepository: InMemoryProjectsRepository
let projectScheduledRepository: InMemoryProjectScheduledRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let registerLog: RegisterLogUseCase
let sut: PublishProjectUseCase

describe('(UC) - Publish Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectScheduledRepository = new InMemoryProjectScheduledRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new PublishProjectUseCase(projectsRepository, projectScheduledRepository, registerLog)
  })

  it('deve ser possível publicar manualmente um projeto em rascunho', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.project.status).toBe(ProjectStatus.PUBLISHED)
    }

    expect(projectsRepository.items[0].status).toBe(ProjectStatus.PUBLISHED)
  })

  it('deve registrar um log de auditoria quando o projeto é publicado', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
    expect(auditLogsRepository.items[0].resource).toBe('project')
  })

  it('deve registrar o lançamento de hoje ao publicar manualmente um projeto em rascunho', async () => {
    const now = new Date('2026-10-26T15:00:00.000Z')
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      date: now,
    })

    expect(projectScheduledRepository.items).toHaveLength(1)
    expect(projectScheduledRepository.items[0].projectId.toString()).toBe(project.id.toString())
    expect(projectScheduledRepository.items[0].publishedIn).toEqual(now)
  })

  it('deve trazer o lançamento de um projeto agendado para o momento da publicação manual', async () => {
    const now = new Date('2026-10-26T15:00:00.000Z')
    const { project } = makeProject({ status: ProjectStatus.SCHEDULED })
    projectsRepository.items.push(project)

    const { projectScheduled } = makeProjectScheduled({
      projectId: project.id,
      publishedIn: new Date('2099-01-01T12:00:00.000Z'),
    })
    projectScheduledRepository.items.push(projectScheduled)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      date: now,
    })

    expect(result.isRight()).toBeTruthy()
    expect(projectsRepository.items[0].status).toBe(ProjectStatus.PUBLISHED)
    expect(projectScheduledRepository.items).toHaveLength(1)
    expect(projectScheduledRepository.items[0].publishedIn).toEqual(now)
  })

  it('não deve publicar um projeto que não existe', async () => {
    const result = await sut.execute({
      projectId: 'projeto-inexistente',
      authorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve publicar um projeto de outro autor', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(projectsRepository.items[0].status).toBe(ProjectStatus.SKETCH)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotProjectOwnerError)
    }
  })

  it.each([ProjectStatus.PUBLISHED, ProjectStatus.ARCHIVED])(
    'não deve publicar um projeto com status %s',
    async (status) => {
      const { project } = makeProject({ status })
      projectsRepository.items.push(project)

      const result = await sut.execute({
        projectId: project.id.toString(),
        authorId: project.author.toString(),
      })

      expect(result.isLeft()).toBeTruthy()
      expect(projectsRepository.items[0].status).toBe(status)
      expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidProjectStatusError)
      }
    },
  )
})
