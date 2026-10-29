import { makeProject } from '@tests/factories/make-project'
import { makeProjectScheduled } from '@tests/factories/make-project-scheduled'
import { InMemoryProjectScheduledRepository } from '@tests/repositories/in-memory-project-scheduled-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { FetchScheduledProjectsUseCase } from './fetch-scheduled-projects'

let projectsRepository: InMemoryProjectsRepository
let projectScheduledRepository: InMemoryProjectScheduledRepository
let sut: FetchScheduledProjectsUseCase

const now = new Date('2026-09-11T10:00:00.000Z')
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

function scheduleProject(status: ProjectStatus, publishedIn: Date) {
  const { project } = makeProject({ status })
  const { projectScheduled } = makeProjectScheduled({ projectId: project.id, publishedIn })

  projectsRepository.items.push(project)
  projectScheduledRepository.items.push(projectScheduled)

  return project
}

describe('(UC) - Fetch Scheduled Projects', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectScheduledRepository = new InMemoryProjectScheduledRepository()
    sut = new FetchScheduledProjectsUseCase(projectsRepository, projectScheduledRepository)
  })

  it('deve listar os projetos agendados para os próximos 7 dias, do mais próximo ao mais distante', async () => {
    const inThreeDays = scheduleProject(ProjectStatus.SCHEDULED, daysFromNow(3))
    const tomorrow = scheduleProject(ProjectStatus.SCHEDULED, daysFromNow(1))
    const inSevenDays = scheduleProject(ProjectStatus.SCHEDULED, daysFromNow(7))
    scheduleProject(ProjectStatus.SCHEDULED, daysFromNow(8))
    scheduleProject(ProjectStatus.SCHEDULED, daysFromNow(-1))

    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      const ids = result.value.scheduledProjects.map((item) => item.project.id.toString())

      expect(ids).toEqual([tomorrow.id.toString(), inThreeDays.id.toString(), inSevenDays.id.toString()])
    }
  })

  it('deve devolver a data de lançamento junto com cada projeto', async () => {
    const publishedIn = daysFromNow(2)
    scheduleProject(ProjectStatus.SCHEDULED, publishedIn)

    const result = await sut.execute({ date: now })

    if (result.isRight()) {
      expect(result.value.scheduledProjects).toHaveLength(1)
      expect(result.value.scheduledProjects[0].publishedIn).toEqual(publishedIn)
    }
  })

  it('não deve listar projetos que não estejam com o status agendado', async () => {
    const scheduled = scheduleProject(ProjectStatus.SCHEDULED, daysFromNow(2))
    scheduleProject(ProjectStatus.ARCHIVED, daysFromNow(2))
    scheduleProject(ProjectStatus.PUBLISHED, daysFromNow(2))
    scheduleProject(ProjectStatus.SKETCH, daysFromNow(2))

    const result = await sut.execute({ date: now })

    if (result.isRight()) {
      expect(result.value.scheduledProjects).toHaveLength(1)
      expect(result.value.scheduledProjects[0].project.id.toString()).toBe(scheduled.id.toString())
    }
  })

  it('deve devolver uma lista vazia quando não há projetos agendados', async () => {
    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.scheduledProjects).toHaveLength(0)
    }
  })
})
