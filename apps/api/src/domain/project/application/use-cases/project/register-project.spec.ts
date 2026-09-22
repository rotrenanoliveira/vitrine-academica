import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { RegisterProjectUseCase } from './register-project'

let projectsRepository: InMemoryProjectsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: RegisterProjectUseCase

describe('(UC) - Register Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new RegisterProjectUseCase(projectsRepository, registerLog)
  })

  it('pode registrar um novo projeto', async () => {
    const authorId = new UniqueEntityId().toString()
    const sessionId = new UniqueEntityId().toString()

    const result = await sut.execute({
      title: 'Vitrine de pesquisa',
      description: 'Projeto acadêmico de divulgação científica',
      authorId,
      sessionId,
      attachments: ['attachment-1'],
      tags: ['tag-1'],
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.project.title).toBe('Vitrine de pesquisa')
      expect(result.value.project.description).toBe('Projeto acadêmico de divulgação científica')
      expect(result.value.project.author.toString()).toBe(authorId)
      expect(result.value.project.status).toBe(ProjectStatus.SKETCH)
      expect(result.value.project.attachments).toEqual(['attachment-1'])
      expect(result.value.project.tags).toEqual(['tag-1'])
      expect(projectsRepository.items).toHaveLength(1)
    }
  })

  it('deve registrar um audit log ao criar um projeto', async () => {
    const authorId = new UniqueEntityId().toString()
    const sessionId = new UniqueEntityId().toString()

    const result = await sut.execute({
      title: 'Vitrine de pesquisa',
      description: 'Projeto acadêmico de divulgação científica',
      authorId,
      sessionId,
      attachments: ['attachment-1'],
      tags: ['tag-1'],
    })

    expect(result.isRight()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
  })
})
