import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { FetchMyProjectsUseCase } from './fetch-my-projects'

let projectsRepository: InMemoryProjectsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let sut: FetchMyProjectsUseCase

function addMembership(
  project: ReturnType<typeof makeProject>['project'],
  userId: UniqueEntityId,
  status: ProjectMemberStatus,
) {
  projectsRepository.items.push(project)

  const { projectMember } = makeProjectMember({ projectId: project.id, userId, status })
  projectMembersRepository.items.push(projectMember)
}

describe('(UC) - Fetch My Projects', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    sut = new FetchMyProjectsUseCase(projectsRepository, projectMembersRepository)
  })

  it('deve listar os projetos criados pela pessoa', async () => {
    const { project: mine } = makeProject()
    const { project: other } = makeProject()
    projectsRepository.items.push(mine, other)

    const result = await sut.execute({ authorId: mine.author.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(mine.id.toString())
    }
  })

  it('deve filtrar os projetos pelo status', async () => {
    const author = makeProject().project.author
    const { project: sketch } = makeProject({ author, status: ProjectStatus.SKETCH })
    const { project: published } = makeProject({ author, status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(sketch, published)

    const result = await sut.execute({
      authorId: author.toString(),
      status: ProjectStatus.SKETCH,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].status).toBe(ProjectStatus.SKETCH)
    }
  })

  it('deve incluir os projetos em que a pessoa aceitou ser coautora', async () => {
    const userId = new UniqueEntityId()
    const { project: coauthored } = makeProject({ status: ProjectStatus.PUBLISHED })
    addMembership(coauthored, userId, ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({ authorId: userId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(coauthored.id.toString())
    }
  })

  it.each([ProjectMemberStatus.PENDING, ProjectMemberStatus.REJECTED])(
    'não deve incluir projetos em que o convite está %s',
    async (memberStatus) => {
      const userId = new UniqueEntityId()
      const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
      addMembership(project, userId, memberStatus)

      const result = await sut.execute({ authorId: userId.toString() })

      if (result.isRight()) {
        expect(result.value.projects).toHaveLength(0)
      }
    },
  )

  it.each([ProjectStatus.SKETCH, ProjectStatus.SCHEDULED, ProjectStatus.PUBLISHED])(
    'deve incluir os projetos de coautoria com status %s',
    async (projectStatus) => {
      const userId = new UniqueEntityId()
      const { project } = makeProject({ status: projectStatus })
      addMembership(project, userId, ProjectMemberStatus.ACCEPTED)

      const result = await sut.execute({ authorId: userId.toString() })

      if (result.isRight()) {
        expect(result.value.projects).toHaveLength(1)
        expect(result.value.projects[0].status).toBe(projectStatus)
      }
    },
  )

  it('deve aplicar o filtro de status também aos projetos de coautoria', async () => {
    const userId = new UniqueEntityId()
    const { project: sketch } = makeProject({ status: ProjectStatus.SKETCH })
    const { project: published } = makeProject({ status: ProjectStatus.PUBLISHED })
    addMembership(sketch, userId, ProjectMemberStatus.ACCEPTED)
    addMembership(published, userId, ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({ authorId: userId.toString(), status: ProjectStatus.SKETCH })

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(sketch.id.toString())
    }
  })

  it('deve ordenar do mais novo para o mais antigo, misturando os próprios e os de coautoria', async () => {
    const userId = new UniqueEntityId()
    const { project: older } = makeProject({
      author: userId,
      status: ProjectStatus.PUBLISHED,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
    })
    const { project: newer } = makeProject({
      status: ProjectStatus.PUBLISHED,
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
    })
    projectsRepository.items.push(older)
    addMembership(newer, userId, ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({ authorId: userId.toString() })

    if (result.isRight()) {
      expect(result.value.projects.map((project) => project.id.toString())).toEqual([
        newer.id.toString(),
        older.id.toString(),
      ])
    }
  })
})
