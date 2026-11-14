import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { ListProjectMembersUseCase } from './list-project-members'

let projectsRepository: InMemoryProjectsRepository
let usersRepository: InMemoryUsersRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let sut: ListProjectMembersUseCase

function setup(projectStatus: ProjectStatus = ProjectStatus.PUBLISHED) {
  const { user: owner } = makeUser({ status: UserStatus.ACTIVE })
  const { project } = makeProject({ author: owner.id, status: projectStatus })

  usersRepository.items.push(owner)
  projectsRepository.items.push(project)

  return { owner, project }
}

function addMember(
  projectId: UniqueEntityId,
  status: ProjectMemberStatus = ProjectMemberStatus.PENDING,
  createdAt: Date = new Date(),
) {
  const { user } = makeUser({ status: UserStatus.ACTIVE })
  const { projectMember } = makeProjectMember({ projectId, userId: user.id, status, createdAt })

  usersRepository.items.push(user)
  projectMembersRepository.items.push(projectMember)

  return { user, projectMember }
}

describe('(UC) - List Project Members', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    usersRepository = new InMemoryUsersRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()

    sut = new ListProjectMembersUseCase(projectsRepository, usersRepository, projectMembersRepository)
  })

  it('deve mostrar a outra pessoa só os coautores que aceitaram, em um projeto publicado', async () => {
    const { project } = setup()
    addMember(project.id, ProjectMemberStatus.PENDING)
    const accepted = addMember(project.id, ProjectMemberStatus.ACCEPTED)
    addMember(project.id, ProjectMemberStatus.REJECTED)

    const result = await sut.execute({
      projectId: project.id.toString(),
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.members).toHaveLength(1)
      expect(result.value.members[0].projectMember.id.toString()).toBe(accepted.projectMember.id.toString())
      expect(result.value.members[0].projectMember.status).toBe(ProjectMemberStatus.ACCEPTED)
    }
  })

  it('deve listar só coautores aceitos para visitante sem autenticação em projeto publicado', async () => {
    const { project } = setup()
    addMember(project.id, ProjectMemberStatus.PENDING)
    const accepted = addMember(project.id, ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({
      projectId: project.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.members).toHaveLength(1)
      expect(result.value.members[0].projectMember.id.toString()).toBe(accepted.projectMember.id.toString())
    }
  })

  it('não deve listar membros de rascunho para visitante sem autenticação', async () => {
    const { project } = setup(ProjectStatus.SKETCH)
    addMember(project.id, ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({
      projectId: project.id.toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve mostrar a lista de um projeto não publicado para quem não é o dono', async () => {
    const { project } = setup(ProjectStatus.SKETCH)
    addMember(project.id, ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({
      projectId: project.id.toString(),
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não deve listar os membros de um projeto que não existe', async () => {
    const result = await sut.execute({
      projectId: 'projeto-inexistente',
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('deve listar do convite mais antigo para o mais novo', async () => {
    const { owner, project } = setup()
    const newest = addMember(project.id, ProjectMemberStatus.ACCEPTED, new Date('2026-03-01T10:00:00.000Z'))
    const oldest = addMember(project.id, ProjectMemberStatus.ACCEPTED, new Date('2026-01-01T10:00:00.000Z'))

    const result = await sut.execute({ projectId: project.id.toString(), requesterId: owner.id.toString() })

    if (result.isRight()) {
      expect(result.value.members.map((item) => item.projectMember.id.toString())).toEqual([
        oldest.projectMember.id.toString(),
        newest.projectMember.id.toString(),
      ])
    }
  })

  it('deve mostrar o nome de cada membro', async () => {
    const { owner, project } = setup()
    const { user } = addMember(project.id, ProjectMemberStatus.ACCEPTED)

    const result = await sut.execute({ projectId: project.id.toString(), requesterId: owner.id.toString() })

    if (result.isRight()) {
      expect(result.value.members[0].user.name).toBe(user.name)
    }
  })

  it('deve ignorar o membro cujo usuário não existe mais', async () => {
    const { owner, project } = setup()
    const kept = addMember(project.id, ProjectMemberStatus.ACCEPTED)
    const { projectMember: orphan } = makeProjectMember({
      projectId: project.id,
      status: ProjectMemberStatus.ACCEPTED,
    })
    projectMembersRepository.items.push(orphan)

    const result = await sut.execute({ projectId: project.id.toString(), requesterId: owner.id.toString() })

    if (result.isRight()) {
      expect(result.value.members).toHaveLength(1)
      expect(result.value.members[0].projectMember.id.toString()).toBe(kept.projectMember.id.toString())
    }
  })

  it('deve devolver uma lista vazia quando o projeto não tem membros', async () => {
    const { owner, project } = setup()

    const result = await sut.execute({ projectId: project.id.toString(), requesterId: owner.id.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.members).toEqual([])
    }
  })

  it('deve mostrar ao dono os coautores e os convites pendentes, sem os recusados', async () => {
    const { owner, project } = setup()
    addMember(project.id, ProjectMemberStatus.PENDING)
    addMember(project.id, ProjectMemberStatus.ACCEPTED)
    addMember(project.id, ProjectMemberStatus.REJECTED)

    const result = await sut.execute({ projectId: project.id.toString(), requesterId: owner.id.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.members).toHaveLength(2)
      expect(result.value.members.map((item) => item.projectMember.status).sort()).toEqual([
        ProjectMemberStatus.ACCEPTED,
        ProjectMemberStatus.PENDING,
      ])
    }
  })

  it.each([ProjectStatus.SKETCH, ProjectStatus.SCHEDULED])(
    'deve mostrar ao coautor que aceitou a lista de um projeto com status %s',
    async (projectStatus) => {
      const { project } = setup(projectStatus)
      const accepted = addMember(project.id, ProjectMemberStatus.ACCEPTED)
      addMember(project.id, ProjectMemberStatus.PENDING)

      const result = await sut.execute({ projectId: project.id.toString(), requesterId: accepted.user.id.toString() })

      expect(result.isRight()).toBeTruthy()
      if (result.isRight()) {
        expect(result.value.members).toHaveLength(1)
        expect(result.value.members[0].projectMember.id.toString()).toBe(accepted.projectMember.id.toString())
      }
    },
  )
})
