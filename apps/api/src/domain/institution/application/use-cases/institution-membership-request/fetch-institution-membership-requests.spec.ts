import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequest } from '@tests/factories/make-institution-membership-request'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionMembershipRequestsRepository } from '@tests/repositories/in-memory-institution-membership-requests-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { FetchInstitutionMembershipRequestsUseCase } from './fetch-institution-membership-requests'

let institutionsRepository: InMemoryInstitutionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let institutionMembershipRequestsRepository: InMemoryInstitutionMembershipRequestsRepository
let sut: FetchInstitutionMembershipRequestsUseCase

describe('(UC) - Fetch Institution Membership Requests', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    institutionMembershipRequestsRepository = new InMemoryInstitutionMembershipRequestsRepository()
    sut = new FetchInstitutionMembershipRequestsUseCase(
      institutionsRepository,
      institutionMembersRepository,
      institutionMembershipRequestsRepository,
    )
  })

  it('should able to fetch membership requests as manager', async () => {
    const actorId = new UniqueEntityId().toString()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const { request: first } = makeInstitutionMembershipRequest({
      institutionId: institution.id.toString(),
    })
    const { request: second } = makeInstitutionMembershipRequest({
      institutionId: institution.id.toString(),
    })
    institutionMembershipRequestsRepository.items.push(first, second)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.requests).toHaveLength(2)
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
