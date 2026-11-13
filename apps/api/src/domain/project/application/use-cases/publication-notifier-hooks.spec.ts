import { makeProject } from '@tests/factories/make-project'
import { makeProjectScheduled } from '@tests/factories/make-project-scheduled'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectScheduledRepository } from '@tests/repositories/in-memory-project-scheduled-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import type { PublicationNotifier } from '@/domain/project/application/notifier/publication-notifier'
import { PublishProjectUseCase } from '@/domain/project/application/use-cases/project/publish-project'
import { UpdateProjectUseCase } from '@/domain/project/application/use-cases/project/update-project'
import { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

class FakeNotifier implements PublicationNotifier {
  public calls: string[] = []
  public shouldFail = false

  async execute({ projectId }: { projectId: string }) {
    if (this.shouldFail) {
      throw new Error('Falha simulada ao criar os avisos')
    }

    this.calls.push(projectId)
  }
}

let projectsRepository: InMemoryProjectsRepository
let projectScheduledRepository: InMemoryProjectScheduledRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let registerLog: RegisterLogUseCase
let notifier: FakeNotifier

const now = new Date('2026-09-09T10:00:00.000Z')

function addProject(status: ProjectStatus) {
  const { project } = makeProject({ status })
  projectsRepository.items.push(project)

  return project
}

describe('(UC) - Avisos de publicação nos três caminhos', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectScheduledRepository = new InMemoryProjectScheduledRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    registerLog = new RegisterLogUseCase(new InMemoryAuditLogsRepository())
    notifier = new FakeNotifier()
  })

  describe('publicar agora', () => {
    it('deve criar os avisos quando o projeto é publicado', async () => {
      const project = addProject(ProjectStatus.SKETCH)
      const sut = new PublishProjectUseCase(projectsRepository, projectScheduledRepository, registerLog, notifier)

      const result = await sut.execute({ projectId: project.id.toString(), authorId: project.author.toString() })

      expect(result.isRight()).toBeTruthy()
      expect(notifier.calls).toEqual([project.id.toString()])
    })

    it('deve publicar mesmo quando a criação dos avisos dá erro', async () => {
      const project = addProject(ProjectStatus.SKETCH)
      notifier.shouldFail = true
      const sut = new PublishProjectUseCase(projectsRepository, projectScheduledRepository, registerLog, notifier)

      const result = await sut.execute({ projectId: project.id.toString(), authorId: project.author.toString() })

      expect(result.isRight()).toBeTruthy()
      expect(project.status).toBe(ProjectStatus.PUBLISHED)
    })

    it('deve continuar funcionando sem o notificador', async () => {
      const project = addProject(ProjectStatus.SKETCH)
      const sut = new PublishProjectUseCase(projectsRepository, projectScheduledRepository, registerLog)

      const result = await sut.execute({ projectId: project.id.toString(), authorId: project.author.toString() })

      expect(result.isRight()).toBeTruthy()
      expect(project.status).toBe(ProjectStatus.PUBLISHED)
    })

    it('não deve criar avisos quando a publicação é recusada', async () => {
      const project = addProject(ProjectStatus.ARCHIVED)
      const sut = new PublishProjectUseCase(projectsRepository, projectScheduledRepository, registerLog, notifier)

      const result = await sut.execute({ projectId: project.id.toString(), authorId: project.author.toString() })

      expect(result.isLeft()).toBeTruthy()
      expect(notifier.calls).toHaveLength(0)
    })
  })

  describe('agendador', () => {
    function schedule(status: ProjectStatus, publishedIn: Date) {
      const project = addProject(status)
      const { projectScheduled } = makeProjectScheduled({ projectId: project.id, publishedIn })
      projectScheduledRepository.items.push(projectScheduled)

      return project
    }

    it('deve criar os avisos de cada projeto que o agendador publica', async () => {
      const first = schedule(ProjectStatus.SCHEDULED, new Date('2026-09-09T09:00:00.000Z'))
      const second = schedule(ProjectStatus.SCHEDULED, new Date('2026-09-09T09:30:00.000Z'))
      const sut = new PublishScheduledProjectsUseCase(
        projectsRepository,
        projectScheduledRepository,
        registerLog,
        notifier,
      )

      await sut.execute({ date: now })

      expect(notifier.calls.sort()).toEqual([first.id.toString(), second.id.toString()].sort())
    })

    it('não deve criar avisos de projeto agendado para o futuro', async () => {
      schedule(ProjectStatus.SCHEDULED, new Date('2026-09-10T09:00:00.000Z'))
      const sut = new PublishScheduledProjectsUseCase(
        projectsRepository,
        projectScheduledRepository,
        registerLog,
        notifier,
      )

      await sut.execute({ date: now })

      expect(notifier.calls).toHaveLength(0)
    })

    it('deve publicar mesmo quando a criação dos avisos dá erro', async () => {
      const project = schedule(ProjectStatus.SCHEDULED, new Date('2026-09-09T09:00:00.000Z'))
      notifier.shouldFail = true
      const sut = new PublishScheduledProjectsUseCase(
        projectsRepository,
        projectScheduledRepository,
        registerLog,
        notifier,
      )

      const result = await sut.execute({ date: now })

      expect(result.isRight()).toBeTruthy()
      expect(project.status).toBe(ProjectStatus.PUBLISHED)
    })
  })

  describe('editar', () => {
    function makeSut() {
      return new UpdateProjectUseCase(projectsRepository, registerLog, projectMembersRepository, notifier)
    }

    it('deve criar os avisos quando o dono muda o status para publicado', async () => {
      const project = addProject(ProjectStatus.SKETCH)

      const result = await makeSut().execute({
        projectId: project.id.toString(),
        authorId: project.author.toString(),
        title: project.title,
        description: project.description,
        status: ProjectStatus.PUBLISHED,
      })

      expect(result.isRight()).toBeTruthy()
      expect(notifier.calls).toEqual([project.id.toString()])
    })

    it('não deve criar avisos quando o projeto já estava publicado', async () => {
      const project = addProject(ProjectStatus.PUBLISHED)

      await makeSut().execute({
        projectId: project.id.toString(),
        authorId: project.author.toString(),
        title: 'Título novo',
        description: project.description,
        status: ProjectStatus.PUBLISHED,
      })

      expect(notifier.calls).toHaveLength(0)
    })

    it('não deve criar avisos quando o status não muda', async () => {
      const project = addProject(ProjectStatus.SKETCH)

      await makeSut().execute({
        projectId: project.id.toString(),
        authorId: project.author.toString(),
        title: 'Título novo',
        description: project.description,
      })

      expect(notifier.calls).toHaveLength(0)
    })

    it('deve salvar a edição mesmo quando a criação dos avisos dá erro', async () => {
      const project = addProject(ProjectStatus.SKETCH)
      notifier.shouldFail = true

      const result = await makeSut().execute({
        projectId: project.id.toString(),
        authorId: project.author.toString(),
        title: 'Título novo',
        description: project.description,
        status: ProjectStatus.PUBLISHED,
      })

      expect(result.isRight()).toBeTruthy()
      expect(project.status).toBe(ProjectStatus.PUBLISHED)
      expect(project.title).toBe('Título novo')
    })
  })
})
