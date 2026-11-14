import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { ListMyProjectInvitationsUseCase } from './list-my-project-invitations'

let projectsRepository: InMemoryProjectsRepository
let usersRepository: InMemoryUsersRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let sut: ListMyProjectInvitationsUseCase

function invite(
  guestId: UniqueEntityId,
  status: ProjectMemberStatus = ProjectMemberStatus.PENDING,
  createdAt: Date = new Date(),
) {
  const { user: owner } = makeUser({ status: UserStatus.ACTIVE })
  const { project } = makeProject({ author: owner.id })
  const { projectMember } = makeProjectMember({ projectId: project.id, userId: guestId, status, createdAt })

  usersRepository.items.push(owner)
  projectsRepository.items.push(project)
  projectMembersRepository.items.push(projectMember)

  return { owner, project, projectMember }
}

describe('(UC) - List My Project Invitations', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    usersRepository = new InMemoryUsersRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()

    sut = new ListMyProjectInvitationsUseCase(projectsRepository, usersRepository, projectMembersRepository)
  })

  it('deve listar os convites da pessoa com o projeto e o dono de cada um', async () => {
    const guestId = new UniqueEntityId()
    const { owner, project, projectMember } = invite(guestId)

    const result = await sut.execute({ userId: guestId.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.invitations).toHaveLength(1)
      expect(result.value.invitations[0].projectMember.id.toString()).toBe(projectMember.id.toString())
      expect(result.value.invitations[0].project.title).toBe(project.title)
      expect(result.value.invitations[0].owner?.name).toBe(owner.name)
    }
  })

  it('não deve listar convites de outras pessoas', async () => {
    const guestId = new UniqueEntityId()
    invite(guestId)
    invite(new UniqueEntityId())

    const result = await sut.execute({ userId: guestId.toString() })

    if (result.isRight()) {
      expect(result.value.invitations).toHaveLength(1)
    }
  })

  it('deve filtrar os convites pelo status', async () => {
    const guestId = new UniqueEntityId()
    const pending = invite(guestId, ProjectMemberStatus.PENDING)
    invite(guestId, ProjectMemberStatus.ACCEPTED)
    invite(guestId, ProjectMemberStatus.REJECTED)

    const result = await sut.execute({ userId: guestId.toString(), status: ProjectMemberStatus.PENDING })

    if (result.isRight()) {
      expect(result.value.invitations).toHaveLength(1)
      expect(result.value.invitations[0].projectMember.id.toString()).toBe(pending.projectMember.id.toString())
    }
  })

  it('deve listar do convite mais novo para o mais antigo', async () => {
    const guestId = new UniqueEntityId()
    const oldest = invite(guestId, ProjectMemberStatus.PENDING, new Date('2026-01-01T10:00:00.000Z'))
    const newest = invite(guestId, ProjectMemberStatus.PENDING, new Date('2026-03-01T10:00:00.000Z'))

    const result = await sut.execute({ userId: guestId.toString() })

    if (result.isRight()) {
      expect(result.value.invitations.map((item) => item.projectMember.id.toString())).toEqual([
        newest.projectMember.id.toString(),
        oldest.projectMember.id.toString(),
      ])
    }
  })

  it('deve ignorar o convite cujo projeto não existe mais', async () => {
    const guestId = new UniqueEntityId()
    const kept = invite(guestId)
    const { projectMember: orphan } = makeProjectMember({ userId: guestId })
    projectMembersRepository.items.push(orphan)

    const result = await sut.execute({ userId: guestId.toString() })

    if (result.isRight()) {
      expect(result.value.invitations).toHaveLength(1)
      expect(result.value.invitations[0].projectMember.id.toString()).toBe(kept.projectMember.id.toString())
    }
  })

  it('deve devolver uma lista vazia quando a pessoa não tem convites', async () => {
    const result = await sut.execute({ userId: new UniqueEntityId().toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.invitations).toEqual([])
    }
  })
})
