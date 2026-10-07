import { makePreferenceTag } from '@tests/factories/make-preference-tag'
import { makeProject } from '@tests/factories/make-project'
import { makeProjectTag } from '@tests/factories/make-project-tag'
import { makeTag } from '@tests/factories/make-tag'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryPreferenceTagsRepository } from '@tests/repositories/in-memory-preference-tags-repository'
import { InMemoryProjectTagsRepository } from '@tests/repositories/in-memory-project-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { PreferenceTagStatus } from '@/domain/tag/enterprise/entities/preference-tag'
import { FetchProjectsOfInterestUseCase } from './fetch-projects-of-interest'

let preferenceTagsRepository: InMemoryPreferenceTagsRepository
let projectTagsRepository: InMemoryProjectTagsRepository
let projectsRepository: InMemoryProjectsRepository
let usersRepository: InMemoryUsersRepository
let sut: FetchProjectsOfInterestUseCase

describe('(UC) - Fetch Projects Of Interest', () => {
  beforeEach(() => {
    preferenceTagsRepository = new InMemoryPreferenceTagsRepository()
    projectTagsRepository = new InMemoryProjectTagsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    usersRepository = new InMemoryUsersRepository()
    sut = new FetchProjectsOfInterestUseCase(
      preferenceTagsRepository,
      projectTagsRepository,
      projectsRepository,
      usersRepository,
    )
  })

  it('pode buscar projetos de interesse baseado nas tags preferências de usuário', async () => {
    const { user } = makeUser()
    const { tag: preferredTag } = makeTag()
    const { tag: otherTag } = makeTag()
    const { project: interestingProject } = makeProject()
    const { project: anotherInterestingProject } = makeProject()
    const { project: unrelatedProject } = makeProject()

    usersRepository.items.push(user)

    const { preferenceTag } = makePreferenceTag({
      userId: user.id,
      tagId: preferredTag.id,
    })
    preferenceTagsRepository.items.push(preferenceTag)

    projectsRepository.items.push(interestingProject, anotherInterestingProject, unrelatedProject)

    const { projectTag: firstLink } = makeProjectTag({
      projectId: interestingProject.id,
      tagId: preferredTag.id,
    })
    const { projectTag: secondLink } = makeProjectTag({
      projectId: anotherInterestingProject.id,
      tagId: preferredTag.id,
    })
    const { projectTag: unrelatedLink } = makeProjectTag({
      projectId: unrelatedProject.id,
      tagId: otherTag.id,
    })
    projectTagsRepository.items.push(firstLink, secondLink, unrelatedLink)

    const result = await sut.execute({
      userId: user.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(2)
      expect(result.value.projects.map((project) => project.id.toString())).toEqual(
        expect.arrayContaining([interestingProject.id.toString(), anotherInterestingProject.id.toString()]),
      )
    }
  })

  it('pode ignorar tags de preferência inativas', async () => {
    const { user } = makeUser()
    const { tag } = makeTag()
    const { project } = makeProject()

    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    const { preferenceTag } = makePreferenceTag({
      userId: user.id,
      tagId: tag.id,
      status: PreferenceTagStatus.INACTIVE,
    })
    preferenceTagsRepository.items.push(preferenceTag)

    const { projectTag } = makeProjectTag({
      projectId: project.id,
      tagId: tag.id,
    })
    projectTagsRepository.items.push(projectTag)

    const result = await sut.execute({
      userId: user.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(0)
    }
  })

  it('não pode buscar projetos de interesse quando o usuário não existe', async () => {
    const result = await sut.execute({
      userId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
