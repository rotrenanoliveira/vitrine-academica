import { makeProject } from '@tests/factories/make-project'
import { makeProjectScheduled } from '@tests/factories/make-project-scheduled'
import { InMemoryProjectScheduledRepository } from '@tests/repositories/in-memory-project-scheduled-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { ProjectStatus } from '../../enterprise/entities/project'
import { FetchPublishedProjectsTodayUseCase } from './fetch-published-projects-today'

let projectsRepository: InMemoryProjectsRepository
let projectScheduledRepository: InMemoryProjectScheduledRepository
let sut: FetchPublishedProjectsTodayUseCase

function launch(status: ProjectStatus, publishedIn: Date) {
  const { project } = makeProject({ status })
  const { projectScheduled } = makeProjectScheduled({ projectId: project.id, publishedIn })

  projectsRepository.items.push(project)
  projectScheduledRepository.items.push(projectScheduled)

  return project
}

describe('(UC) - Fetch Published Projects Today', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectScheduledRepository = new InMemoryProjectScheduledRepository()
    sut = new FetchPublishedProjectsTodayUseCase(projectsRepository, projectScheduledRepository)
  })

  it('deve listar os projetos publicados com lançamento hoje', async () => {
    const now = new Date('2026-09-09T15:00:00.000Z')
    const today = launch(ProjectStatus.PUBLISHED, new Date('2026-09-09T12:00:00.000Z'))
    launch(ProjectStatus.PUBLISHED, new Date('2026-09-08T12:00:00.000Z'))

    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects.map((project) => project.id.toString())).toEqual([today.id.toString()])
    }
  })

  it('não deve publicar nem listar um projeto agendado para mais tarde', async () => {
    const now = new Date('2026-09-09T13:00:00.000Z')
    const scheduled = launch(ProjectStatus.SCHEDULED, new Date('2026-09-09T21:00:00.000Z'))

    const result = await sut.execute({ date: now })

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(0)
    }

    expect(scheduled.status).toBe(ProjectStatus.SCHEDULED)
  })

  it('não deve listar projetos arquivados ou em rascunho com lançamento hoje', async () => {
    const now = new Date('2026-09-09T15:00:00.000Z')
    const archived = launch(ProjectStatus.ARCHIVED, new Date('2026-09-09T12:00:00.000Z'))
    const sketch = launch(ProjectStatus.SKETCH, new Date('2026-09-09T12:00:00.000Z'))

    const result = await sut.execute({ date: now })

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(0)
    }

    expect(archived.status).toBe(ProjectStatus.ARCHIVED)
    expect(sketch.status).toBe(ProjectStatus.SKETCH)
  })

  it('deve usar o dia de Brasília e não o dia de UTC', async () => {
    const now = new Date('2026-09-10T01:00:00.000Z')
    const startOfDay = launch(ProjectStatus.PUBLISHED, new Date('2026-09-09T03:00:00.000Z'))
    const lateNight = launch(ProjectStatus.PUBLISHED, new Date('2026-09-10T00:30:00.000Z'))
    launch(ProjectStatus.PUBLISHED, new Date('2026-09-09T02:59:00.000Z'))
    launch(ProjectStatus.PUBLISHED, new Date('2026-09-10T03:00:00.000Z'))

    const result = await sut.execute({ date: now })

    if (result.isRight()) {
      expect(result.value.projects.map((project) => project.id.toString())).toEqual([
        startOfDay.id.toString(),
        lateNight.id.toString(),
      ])
    }
  })

  it('deve devolver uma lista vazia quando não há lançamentos hoje', async () => {
    const result = await sut.execute({ date: new Date('2026-09-09T15:00:00.000Z') })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toEqual([])
    }
  })
})
