import { makeTag } from '@tests/factories/make-tag'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectTagsRepository } from '@tests/repositories/in-memory-project-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryTagsRepository } from '@tests/repositories/in-memory-tags-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectSlugAlreadyExistsError } from '../../_errors/project-slug-already-exists-error'
import { RegisterProjectUseCase } from './register-project'

let projectsRepository: InMemoryProjectsRepository
let projectTagsRepository: InMemoryProjectTagsRepository
let tagsRepository: InMemoryTagsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: RegisterProjectUseCase

describe('(UC) - Register Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectTagsRepository = new InMemoryProjectTagsRepository()
    tagsRepository = new InMemoryTagsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new RegisterProjectUseCase(projectsRepository, projectTagsRepository, tagsRepository, registerLog)
  })

  it('pode registrar um novo projeto', async () => {
    const authorId = new UniqueEntityId().toString()
    const sessionId = new UniqueEntityId().toString()
    const { tag } = makeTag()
    tagsRepository.items.push(tag)

    const result = await sut.execute({
      title: 'Vitrine de pesquisa',
      description: 'Projeto acadêmico de divulgação científica',
      slug: 'vitrine-de-pesquisa',
      authorId,
      sessionId,
      coverUrl: 'attachment-cover',
      attachments: ['attachment-1'],
      tags: [tag.id.toString()],
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.project.title).toBe('Vitrine de pesquisa')
      expect(result.value.project.description).toBe('Projeto acadêmico de divulgação científica')
      expect(result.value.project.slug).toBe('vitrine-de-pesquisa')
      expect(result.value.project.author.toString()).toBe(authorId)
      expect(result.value.project.status).toBe(ProjectStatus.SKETCH)
      expect(result.value.project.coverUrl).toBe('attachment-cover')
      expect(result.value.project.attachments).toEqual(['attachment-1'])
      expect(result.value.project.tags).toEqual([tag.id.toString()])
      expect(projectsRepository.items).toHaveLength(1)
      expect(projectTagsRepository.items).toHaveLength(1)
    }
  })

  it('deve registrar um audit log ao criar um projeto', async () => {
    const authorId = new UniqueEntityId().toString()
    const sessionId = new UniqueEntityId().toString()
    const { tag } = makeTag()
    tagsRepository.items.push(tag)

    const result = await sut.execute({
      title: 'Vitrine de pesquisa',
      description: 'Projeto acadêmico de divulgação científica',
      slug: 'vitrine-de-pesquisa',
      authorId,
      sessionId,
      tags: [tag.id.toString()],
    })

    expect(result.isRight()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
  })

  it('não deve registrar projeto com slug duplicado', async () => {
    const authorId = new UniqueEntityId().toString()
    const sessionId = new UniqueEntityId().toString()
    const { tag } = makeTag()
    tagsRepository.items.push(tag)

    await sut.execute({
      title: 'Primeiro',
      description: 'Desc',
      slug: 'mesmo-slug',
      authorId,
      sessionId,
      tags: [tag.id.toString()],
    })

    const result = await sut.execute({
      title: 'Segundo',
      description: 'Desc',
      slug: 'mesmo-slug',
      authorId,
      sessionId,
      tags: [tag.id.toString()],
    })

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(ProjectSlugAlreadyExistsError)
  })

  it('não deve registrar projeto com tag inexistente', async () => {
    const authorId = new UniqueEntityId().toString()
    const sessionId = new UniqueEntityId().toString()

    const result = await sut.execute({
      title: 'Projeto',
      description: 'Desc',
      slug: 'projeto',
      authorId,
      sessionId,
      tags: [new UniqueEntityId().toString()],
    })

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(TagNotFoundError)
  })
})
