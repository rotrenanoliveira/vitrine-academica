import { makeProject } from '@tests/factories/make-project'
import { makeProjectTag } from '@tests/factories/make-project-tag'
import { makeTag } from '@tests/factories/make-tag'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectTagsRepository } from '@tests/repositories/in-memory-project-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { ProjectTagNotFoundError } from '../../_errors/project-tag-not-found-error'
import { RemoveProjectTagUseCase } from './remove-project-tag'

let projectTagsRepository: InMemoryProjectTagsRepository
let projectsRepository: InMemoryProjectsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let registerLog: RegisterLogUseCase
let sut: RemoveProjectTagUseCase

describe('(UC) - Remove Project Tag', () => {
  beforeEach(() => {
    projectTagsRepository = new InMemoryProjectTagsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new RemoveProjectTagUseCase(projectTagsRepository, projectsRepository, registerLog)
  })

  it('pode remover uma tag de um projeto', async () => {
    const { project } = makeProject()
    const { tag } = makeTag()
    const { projectTag } = makeProjectTag({ projectId: project.id, tagId: tag.id })
    project.tags = [tag.id.toString()]
    projectsRepository.items.push(project)
    projectTagsRepository.items.push(projectTag)

    const result = await sut.execute({
      projectId: project.id.toString(),
      actorId: project.author.toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(projectTagsRepository.items).toHaveLength(0)
    expect(project.tags).toEqual([])
  })

  it('should register an audit log when a tag is removed from a project', async () => {
    const { project } = makeProject()
    const { tag } = makeTag()
    const { projectTag } = makeProjectTag({ projectId: project.id, tagId: tag.id })
    project.tags = [tag.id.toString()]
    projectsRepository.items.push(project)
    projectTagsRepository.items.push(projectTag)

    await sut.execute({
      projectId: project.id.toString(),
      actorId: project.author.toString(),
      tagId: tag.id.toString(),
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.DELETE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('limpa a lista project.tags mesmo quando não existe registro em project_tags', async () => {
    const { project } = makeProject()
    const { tag } = makeTag()
    project.tags = [tag.id.toString()]
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      actorId: project.author.toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(project.tags).toEqual([])
  })

  it('não pode remover uma tag quando o projeto não existe', async () => {
    const result = await sut.execute({
      projectId: new UniqueEntityId().toString(),
      actorId: new UniqueEntityId().toString(),
      tagId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não pode remover uma tag de um projeto de outro autor', async () => {
    const { project } = makeProject()
    const { tag } = makeTag()
    const { projectTag } = makeProjectTag({ projectId: project.id, tagId: tag.id })
    projectsRepository.items.push(project)
    projectTagsRepository.items.push(projectTag)

    const result = await sut.execute({
      projectId: project.id.toString(),
      actorId: new UniqueEntityId().toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(projectTagsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotProjectOwnerError)
    }
  })

  it('não pode remover uma tag que não está vinculada ao projeto', async () => {
    const { project } = makeProject()
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      actorId: project.author.toString(),
      tagId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectTagNotFoundError)
    }
  })
})
