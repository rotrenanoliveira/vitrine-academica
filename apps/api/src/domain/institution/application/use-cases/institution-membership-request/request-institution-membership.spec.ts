import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequest } from '@tests/factories/make-institution-membership-request'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionMembershipRequestsRepository } from '@tests/repositories/in-memory-institution-membership-requests-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMembershipRequestRole } from '../../../enterprise/entities/institution-membership-request'
import { InstitutionMemberAlreadyExistsError } from '../../_errors/institution-member-already-exists-error'
import { InstitutionMembershipRequestAlreadyExistsError } from '../../_errors/institution-membership-request-already-exists-error'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { MembershipProofRequiredError } from '../../_errors/membership-proof-required-error'
import { RequestInstitutionMembershipUseCase } from './request-institution-membership'

let institutionsRepository: InMemoryInstitutionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let institutionMembershipRequestsRepository: InMemoryInstitutionMembershipRequestsRepository
let sut: RequestInstitutionMembershipUseCase

describe('(UC) - Request Institution Membership', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    institutionMembershipRequestsRepository = new InMemoryInstitutionMembershipRequestsRepository()
    sut = new RequestInstitutionMembershipUseCase(
      institutionsRepository,
      institutionMembersRepository,
      institutionMembershipRequestsRepository,
    )
  })

  it('should able to request institution membership without proof', async () => {
    const { institution } = makeInstitution({ shouldProof: false })
    institutionsRepository.items.push(institution)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      userId: new UniqueEntityId().toString(),
      role: InstitutionMembershipRequestRole.STUDENT,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.request.role).toBe(InstitutionMembershipRequestRole.STUDENT)
      expect(institutionMembershipRequestsRepository.items).toHaveLength(1)
    }
  })

  it('should able to request institution membership with proof', async () => {
    const { institution } = makeInstitution({ shouldProof: true })
    institutionsRepository.items.push(institution)

    const proofAttachmentId = new UniqueEntityId().toString()

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      userId: new UniqueEntityId().toString(),
      role: InstitutionMembershipRequestRole.PROFESSOR,
      proofAttachmentId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.request.proofAttachmentId).toBe(proofAttachmentId)
    }
  })

  it('should not be able to request membership without proof when required', async () => {
    const { institution } = makeInstitution({ shouldProof: true })
    institutionsRepository.items.push(institution)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      userId: new UniqueEntityId().toString(),
      role: InstitutionMembershipRequestRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(MembershipProofRequiredError)
    }
  })

  it('should not be able to request membership when already a member', async () => {
    const userId = new UniqueEntityId().toString()
    const { institution } = makeInstitution({ shouldProof: false })
    institutionsRepository.items.push(institution)

    const { member } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId,
    })
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      userId,
      role: InstitutionMembershipRequestRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionMemberAlreadyExistsError)
    }
  })

  it('should not be able to request membership when pending request already exists', async () => {
    const userId = new UniqueEntityId().toString()
    const { institution } = makeInstitution({ shouldProof: false })
    institutionsRepository.items.push(institution)

    const { request } = makeInstitutionMembershipRequest({
      institutionId: institution.id.toString(),
      userId,
    })
    institutionMembershipRequestsRepository.items.push(request)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      userId,
      role: InstitutionMembershipRequestRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionMembershipRequestAlreadyExistsError)
    }
  })

  it('should not be able to request membership for an institution that does not exist', async () => {
    const result = await sut.execute({
      institutionId: 'non-existent',
      userId: new UniqueEntityId().toString(),
      role: InstitutionMembershipRequestRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionNotFoundError)
    }
  })
})
