import { makeProject } from '@tests/factories/make-project'
import { makeProjectScheduled } from '@tests/factories/make-project-scheduled'
import { InMemoryProjectScheduledRepository } from '@tests/repositories/in-memory-project-scheduled-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { PublishScheduledProjectsUseCase } from './publish-scheduled-projects'

let projectsRepository: InMemoryProjectsRepository
let projectScheduledRepository: InMemoryProjectScheduledRepository
let sut: PublishScheduledProjectsUseCase

describe('(UC) - Publish Scheduled Projects', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectScheduledRepository = new InMemoryProjectScheduledRepository()
    sut = new PublishScheduledProjectsUseCase(projectsRepository, projectScheduledRepository)
  })

  it('should able to publish projects scheduled for the current day', async () => {
    const today = new Date('2026-09-09T10:00:00.000Z')
    const anotherDay = new Date('2026-09-10T10:00:00.000Z')

    const { project: readyProject } = makeProject({ status: ProjectStatus.SCHEDULED })
    const { project: futureProject } = makeProject({ status: ProjectStatus.SCHEDULED })
    const { project: sketchProject } = makeProject({ status: ProjectStatus.SKETCH })

    projectsRepository.items.push(readyProject, futureProject, sketchProject)

    const { projectScheduled: readySchedule } = makeProjectScheduled({
      projectId: readyProject.id,
      publishedIn: new Date('2026-09-09T18:00:00.000Z'),
    })
    const { projectScheduled: futureSchedule } = makeProjectScheduled({
      projectId: futureProject.id,
      publishedIn: anotherDay,
    })
    const { projectScheduled: sketchSchedule } = makeProjectScheduled({
      projectId: sketchProject.id,
      publishedIn: today,
    })

    projectScheduledRepository.items.push(readySchedule, futureSchedule, sketchSchedule)

    const result = await sut.execute({ date: today })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(readyProject.id.toString())
      expect(readyProject.status).toBe(ProjectStatus.PUBLISHED)
      expect(futureProject.status).toBe(ProjectStatus.SCHEDULED)
      expect(sketchProject.status).toBe(ProjectStatus.SKETCH)
    }
  })
})
