import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { makeProjectScheduled } from '@tests/factories/make-project-scheduled'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectScheduledRepository } from '@tests/repositories/in-memory-project-scheduled-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { GetProjectBySlugUseCase } from './get-project-by-slug'

let projectsRepository: InMemoryProjectsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let projectScheduledRepository: InMemoryProjectScheduledRepository
let sut: GetProjectBySlugUseCase

function setupMember(projectStatus: ProjectStatus, memberStatus: ProjectMemberStatus) {
  const { project } = makeProject({ status: projectStatus })
  const userId = new UniqueEntityId()
  const { projectMember } = makeProjectMember({ projectId: project.id, userId, status: memberStatus })

  projectsRepository.items.push(project)
  projectMembersRepository.items.push(projectMember)

  return { project, userId }
}

describe('(UC) - Get Project By Slug', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    projectScheduledRepository = new InMemoryProjectScheduledRepository()
    sut = new GetProjectBySlugUseCase(projectsRepository, projectMembersRepository, projectScheduledRepository)
  })

  it('deve permitir ao dono ver um projeto em rascunho', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      slug: project.slug,
      requesterId: project.author.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.id.toString()).toBe(project.id.toString())
      expect(result.value.publishedIn).toBeNull()
    }
  })

  it('deve devolver a data de publicação quando o projeto tem agenda', async () => {
    const { project } = makeProject({ status: ProjectStatus.SCHEDULED })
    const publishedIn = new Date('2030-01-15T15:00:00.000Z')
    const { projectScheduled } = makeProjectScheduled({ projectId: project.id, publishedIn })

    projectsRepository.items.push(project)
    projectScheduledRepository.items.push(projectScheduled)

    const result = await sut.execute({
      slug: project.slug,
      requesterId: project.author.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.publishedIn).toEqual(publishedIn)
    }
  })

  it('deve permitir a qualquer pessoa ver um projeto publicado', async () => {
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      slug: project.slug,
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
  })

  it('deve permitir a visitante sem autenticação ver um projeto publicado', async () => {
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      slug: project.slug,
    })

    expect(result.isRight()).toBeTruthy()
  })

  it('não deve permitir a visitante sem autenticação ver um projeto em rascunho', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      slug: project.slug,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve permitir a quem não é dono nem coautor ver um projeto em rascunho', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      slug: project.slug,
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve ser possível ver um projeto que não existe', async () => {
    const result = await sut.execute({
      slug: 'projeto-inexistente',
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it.each([ProjectStatus.SKETCH, ProjectStatus.SCHEDULED, ProjectStatus.PUBLISHED, ProjectStatus.ARCHIVED])(
    'deve permitir ao coautor que aceitou ver um projeto com status %s',
    async (projectStatus) => {
      const { project, userId } = setupMember(projectStatus, ProjectMemberStatus.ACCEPTED)

      const result = await sut.execute({ slug: project.slug, requesterId: userId.toString() })

      expect(result.isRight()).toBeTruthy()
      if (result.isRight()) {
        expect(result.value.project.id.toString()).toBe(project.id.toString())
      }
    },
  )

  it.each([ProjectStatus.SKETCH, ProjectStatus.SCHEDULED, ProjectStatus.ARCHIVED])(
    'deve permitir a quem tem convite pendente ver um projeto com status %s',
    async (projectStatus) => {
      const { project, userId } = setupMember(projectStatus, ProjectMemberStatus.PENDING)

      const result = await sut.execute({ slug: project.slug, requesterId: userId.toString() })

      expect(result.isRight()).toBeTruthy()
      if (result.isRight()) {
        expect(result.value.project.id.toString()).toBe(project.id.toString())
      }
    },
  )

  it('não deve permitir a quem recusou o convite ver um projeto em rascunho', async () => {
    const { project, userId } = setupMember(ProjectStatus.SKETCH, ProjectMemberStatus.REJECTED)

    const result = await sut.execute({ slug: project.slug, requesterId: userId.toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve permitir ao coautor de outro projeto ver um rascunho que não é dele', async () => {
    const { userId } = setupMember(ProjectStatus.SKETCH, ProjectMemberStatus.ACCEPTED)
    const { project: otherProject } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(otherProject)

    const result = await sut.execute({ slug: otherProject.slug, requesterId: userId.toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
