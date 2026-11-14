import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequest } from '@tests/factories/make-institution-membership-request'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionMembershipRequestsRepository } from '@tests/repositories/in-memory-institution-membership-requests-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { FetchInstitutionMembershipRequestsUseCase } from './fetch-institution-membership-requests'

let institutionsRepository: InMemoryInstitutionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let institutionMembershipRequestsRepository: InMemoryInstitutionMembershipRequestsRepository
let usersRepository: InMemoryUsersRepository
let sut: FetchInstitutionMembershipRequestsUseCase

describe('(UC) - Fetch Institution Membership Requests', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    institutionMembershipRequestsRepository = new InMemoryInstitutionMembershipRequestsRepository()
    usersRepository = new InMemoryUsersRepository()
    sut = new FetchInstitutionMembershipRequestsUseCase(
      institutionsRepository,
      institutionMembersRepository,
      institutionMembershipRequestsRepository,
      usersRepository,
    )
  })

  it('should able to fetch membership requests as manager', async () => {
    const { user: managerUser } = makeUser()
    const { user: firstRequester } = makeUser()
    const { user: secondRequester } = makeUser()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)
    usersRepository.items.push(managerUser, firstRequester, secondRequester)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: managerUser.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const { request: first } = makeInstitutionMembershipRequest({
      institutionId: institution.id.toString(),
      userId: firstRequester.id.toString(),
    })
    const { request: second } = makeInstitutionMembershipRequest({
      institutionId: institution.id.toString(),
      userId: secondRequester.id.toString(),
    })
    institutionMembershipRequestsRepository.items.push(first, second)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: managerUser.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.requests).toHaveLength(2)
      expect(result.value.requests.map((item) => item.user.name)).toEqual(
        expect.arrayContaining([firstRequester.name, secondRequester.name]),
      )
    }
  })

  it('should show the name of each requester', async () => {
    const { user: managerUser } = makeUser()
    const { user: requester } = makeUser()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)
    usersRepository.items.push(managerUser, requester)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: managerUser.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const { request } = makeInstitutionMembershipRequest({
      institutionId: institution.id.toString(),
      userId: requester.id.toString(),
    })
    institutionMembershipRequestsRepository.items.push(request)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: managerUser.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.requests[0]?.user.name).toBe(requester.name)
    }
  })

  it('should ignore requests whose user no longer exists', async () => {
    const { user: managerUser } = makeUser()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)
    usersRepository.items.push(managerUser)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: managerUser.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const { request } = makeInstitutionMembershipRequest({
      institutionId: institution.id.toString(),
      userId: new UniqueEntityId().toString(),
    })
    institutionMembershipRequestsRepository.items.push(request)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: managerUser.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.requests).toHaveLength(0)
    }
  })

  it('should not be able to fetch requests when not authorized', async () => {
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedToManageInstitutionError)
    }
  })

  it('should not be able to fetch requests of an institution that does not exist', async () => {
    const result = await sut.execute({
      institutionId: 'non-existent',
      actorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionNotFoundError)
    }
  })
})
