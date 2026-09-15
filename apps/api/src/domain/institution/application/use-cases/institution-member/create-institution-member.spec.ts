import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionMemberAlreadyExistsError } from '../../_errors/institution-member-already-exists-error'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { CreateInstitutionMemberUseCase } from './create-institution-member'

let institutionsRepository: InMemoryInstitutionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let sut: CreateInstitutionMemberUseCase

describe('(UC) - Create Institution Member', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    sut = new CreateInstitutionMemberUseCase(institutionsRepository, institutionMembersRepository)
  })

  it('should able to create an institution member as manager', async () => {
    const actorId = new UniqueEntityId().toString()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const userId = new UniqueEntityId().toString()

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId,
      userId,
      role: InstitutionMemberRole.STUDENT,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.member.userId).toBe(userId)
      expect(result.value.member.role).toBe(InstitutionMemberRole.STUDENT)
      expect(institutionMembersRepository.items).toHaveLength(2)
    }
  })

  it('should not be able to create a member when not authorized', async () => {
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: new UniqueEntityId().toString(),
      userId: new UniqueEntityId().toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedToManageInstitutionError)
    }
  })

  it('should not be able to create a member that already exists', async () => {
    const actorId = new UniqueEntityId().toString()
    const userId = new UniqueEntityId().toString()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })

    const { member: existing } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId,
      role: InstitutionMemberRole.STUDENT,
    })

    institutionMembersRepository.items.push(manager, existing)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId,
      userId,
      role: InstitutionMemberRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionMemberAlreadyExistsError)
    }
  })

  it('should not be able to create a member for an institution that does not exist', async () => {
    const result = await sut.execute({
      institutionId: 'non-existent',
      actorId: new UniqueEntityId().toString(),
      userId: new UniqueEntityId().toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionNotFoundError)
    }
  })
})
