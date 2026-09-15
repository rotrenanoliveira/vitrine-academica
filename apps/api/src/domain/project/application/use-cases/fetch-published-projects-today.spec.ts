import { makeProject } from '@tests/factories/make-project'
import { makeProjectScheduled } from '@tests/factories/make-project-scheduled'
import { InMemoryProjectScheduledRepository } from '@tests/repositories/in-memory-project-scheduled-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { ProjectStatus } from '../../enterprise/entities/project'
import { FetchPublishedProjectsTodayUseCase } from './fetch-published-projects-today'

let projectsRepository: InMemoryProjectsRepository
let projectScheduledRepository: InMemoryProjectScheduledRepository
let sut: FetchPublishedProjectsTodayUseCase

describe('(UC) - Fetch Published Projects Today', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectScheduledRepository = new InMemoryProjectScheduledRepository()
    sut = new FetchPublishedProjectsTodayUseCase(projectsRepository, projectScheduledRepository)
  })

  it('deve ser possível buscar os projetos publicados com agendamento no dia atual', async () => {
    const today = new Date('2026-09-11T10:00:00.000Z')
    const yesterday = new Date('2026-09-10T10:00:00.000Z')

    const { project: scheduledToday } = makeProject({
      status: ProjectStatus.PUBLISHED,
      createdAt: yesterday,
    })
    const { project: scheduledAnotherDay } = makeProject({
      status: ProjectStatus.PUBLISHED,
      createdAt: yesterday,
    })
    const { project: stillScheduled } = makeProject({
      status: ProjectStatus.SCHEDULED,
      createdAt: yesterday,
    })
    const { project: publishedWithoutSchedule } = makeProject({
      status: ProjectStatus.PUBLISHED,
      createdAt: today,
    })

    projectsRepository.items.push(scheduledToday, scheduledAnotherDay, stillScheduled, publishedWithoutSchedule)

    const { projectScheduled: todaySchedule } = makeProjectScheduled({
      projectId: scheduledToday.id,
      publishedIn: new Date('2026-09-11T18:00:00.000Z'),
    })
    const { projectScheduled: anotherDaySchedule } = makeProjectScheduled({
      projectId: scheduledAnotherDay.id,
      publishedIn: yesterday,
    })
    const { projectScheduled: pendingSchedule } = makeProjectScheduled({
      projectId: stillScheduled.id,
      publishedIn: today,
    })

    projectScheduledRepository.items.push(todaySchedule, anotherDaySchedule, pendingSchedule)

    const result = await sut.execute({ date: today })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(scheduledToday.id.toString())
    }
  })
})
