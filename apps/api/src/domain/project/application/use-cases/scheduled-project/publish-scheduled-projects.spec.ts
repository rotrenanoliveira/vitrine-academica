import { makeProject } from '@tests/factories/make-project'
import { makeProjectScheduled } from '@tests/factories/make-project-scheduled'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectScheduledRepository } from '@tests/repositories/in-memory-project-scheduled-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { PublishScheduledProjectsUseCase } from './publish-scheduled-projects'

let projectsRepository: InMemoryProjectsRepository
let projectScheduledRepository: InMemoryProjectScheduledRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let registerLog: RegisterLogUseCase
let sut: PublishScheduledProjectsUseCase

const now = new Date('2026-09-09T10:00:00.000Z')

function scheduleProject(status: ProjectStatus, publishedIn: Date) {
  const { project } = makeProject({ status })
  const { projectScheduled } = makeProjectScheduled({ projectId: project.id, publishedIn })

  projectsRepository.items.push(project)
  projectScheduledRepository.items.push(projectScheduled)

  return project
}

describe('(UC) - Publish Scheduled Projects', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectScheduledRepository = new InMemoryProjectScheduledRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new PublishScheduledProjectsUseCase(projectsRepository, projectScheduledRepository, registerLog)
  })

  it('deve publicar o projeto agendado para um horário que já passou no mesmo dia', async () => {
    const project = scheduleProject(ProjectStatus.SCHEDULED, new Date('2026-09-09T09:00:00.000Z'))

    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
    }

    expect(project.status).toBe(ProjectStatus.PUBLISHED)
  })

  it('não deve publicar o projeto agendado para mais tarde no mesmo dia', async () => {
    const project = scheduleProject(ProjectStatus.SCHEDULED, new Date('2026-09-09T18:00:00.000Z'))

    const result = await sut.execute({ date: now })

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(0)
    }

    expect(project.status).toBe(ProjectStatus.SCHEDULED)
  })

  it('deve publicar o projeto agendado para exatamente o horário atual', async () => {
    const project = scheduleProject(ProjectStatus.SCHEDULED, now)

    await sut.execute({ date: now })

    expect(project.status).toBe(ProjectStatus.PUBLISHED)
  })

  it('deve publicar projetos de dias anteriores que ficaram pendentes', async () => {
    const project = scheduleProject(ProjectStatus.SCHEDULED, new Date('2026-09-08T23:59:00.000Z'))

    await sut.execute({ date: now })

    expect(project.status).toBe(ProjectStatus.PUBLISHED)
  })

  it('não deve publicar projetos que não estejam agendados', async () => {
    const sketch = scheduleProject(ProjectStatus.SKETCH, new Date('2026-09-09T09:00:00.000Z'))
    const archived = scheduleProject(ProjectStatus.ARCHIVED, new Date('2026-09-09T09:00:00.000Z'))

    const result = await sut.execute({ date: now })

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(0)
    }

    expect(sketch.status).toBe(ProjectStatus.SKETCH)
    expect(archived.status).toBe(ProjectStatus.ARCHIVED)
  })

  it('deve registrar um log para cada projeto publicado', async () => {
    scheduleProject(ProjectStatus.SCHEDULED, new Date('2026-09-09T09:00:00.000Z'))
    scheduleProject(ProjectStatus.SCHEDULED, new Date('2026-09-08T12:00:00.000Z'))

    await sut.execute({ date: now })

    expect(auditLogsRepository.items).toHaveLength(2)
  })
})