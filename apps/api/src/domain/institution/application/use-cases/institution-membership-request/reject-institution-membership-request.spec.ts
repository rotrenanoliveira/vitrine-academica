import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequest } from '@tests/factories/make-institution-membership-request'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionMembershipRequestsRepository } from '@tests/repositories/in-memory-institution-membership-requests-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionMembershipRequestStatus } from '../../../enterprise/entities/institution-membership-request'
import { InstitutionMembershipRequestNotFoundError } from '../../_errors/institution-membership-request-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { RejectInstitutionMembershipRequestUseCase } from './reject-institution-membership-request'

let institutionMembershipRequestsRepository: InMemoryInstitutionMembershipRequestsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let sut: RejectInstitutionMembershipRequestUseCase

describe('(UC) - Reject Institution Membership Request', () => {
  beforeEach(() => {
    institutionMembershipRequestsRepository = new InMemoryInstitutionMembershipRequestsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    sut = new RejectInstitutionMembershipRequestUseCase(
      institutionMembershipRequestsRepository,
      institutionMembersRepository,
    )
  })

  it('should able to reject a membership request as manager', async () => {
    const actorId = new UniqueEntityId().toString()
    const institutionId = new UniqueEntityId().toString()

    const { member: manager } = makeInstitutionMember({
      institutionId,
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const { request } = makeInstitutionMembershipRequest({ institutionId })
    institutionMembershipRequestsRepository.items.push(request)

    const result = await sut.execute({
      requestId: request.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.request.status).toBe(InstitutionMembershipRequestStatus.REJECTED)
      expect(institutionMembersRepository.items).toHaveLength(1)
    }
  })

  it('should not be able to reject a request when not authorized', async () => {
    const { request } = makeInstitutionMembershipRequest()
    institutionMembershipRequestsRepository.items.push(request)

    const result = await sut.execute({
      requestId: request.id.toString(),
      actorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedToManageInstitutionError)
    }
  })

  it('should not be able to reject a request that does not exist', async () => {
    const result = await sut.execute({
      requestId: 'non-existent',
      actorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionMembershipRequestNotFoundError)
    }
  })
})
