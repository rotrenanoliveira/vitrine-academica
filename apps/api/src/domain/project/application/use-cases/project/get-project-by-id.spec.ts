import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { GetProjectByIdUseCase } from './get-project-by-id'

let projectsRepository: InMemoryProjectsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let sut: GetProjectByIdUseCase

function setupMember(projectStatus: ProjectStatus, memberStatus: ProjectMemberStatus) {
  const { project } = makeProject({ status: projectStatus })
  const userId = new UniqueEntityId()
  const { projectMember } = makeProjectMember({ projectId: project.id, userId, status: memberStatus })

  projectsRepository.items.push(project)
  projectMembersRepository.items.push(projectMember)

  return { project, userId }
}

describe('(UC) - Get Project By Id', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    sut = new GetProjectByIdUseCase(projectsRepository, projectMembersRepository)
  })

  it('deve permitir ao dono ver um projeto em rascunho', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      requesterId: project.author.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.id.toString()).toBe(project.id.toString())
    }
  })

  it('deve permitir a qualquer pessoa ver um projeto publicado', async () => {
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
  })

  it('não deve permitir a quem não é dono nem coautor ver um projeto em rascunho', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve ser possível ver um projeto que não existe', async () => {
    const result = await sut.execute({
      projectId: 'projeto-inexistente',
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

      const result = await sut.execute({ projectId: project.id.toString(), requesterId: userId.toString() })

      expect(result.isRight()).toBeTruthy()
      if (result.isRight()) {
        expect(result.value.project.id.toString()).toBe(project.id.toString())
      }
    },
  )

  it.each([ProjectMemberStatus.PENDING, ProjectMemberStatus.REJECTED])(
    'não deve permitir a quem tem convite %s ver um projeto em rascunho',
    async (memberStatus) => {
      const { project, userId } = setupMember(ProjectStatus.SKETCH, memberStatus)

      const result = await sut.execute({ projectId: project.id.toString(), requesterId: userId.toString() })

      expect(result.isLeft()).toBeTruthy()
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ProjectNotFoundError)
      }
    },
  )

  it('não deve permitir ao coautor de outro projeto ver um rascunho que não é dele', async () => {
    const { userId } = setupMember(ProjectStatus.SKETCH, ProjectMemberStatus.ACCEPTED)
    const { project: otherProject } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(otherProject)

    const result = await sut.execute({ projectId: otherProject.id.toString(), requesterId: userId.toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
