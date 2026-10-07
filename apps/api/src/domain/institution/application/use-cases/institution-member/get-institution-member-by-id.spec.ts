import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionMemberNotFoundError } from '../../_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { GetInstitutionMemberByIdUseCase } from './get-institution-member-by-id'

let institutionMembersRepository: InMemoryInstitutionMembersRepository
let sut: GetInstitutionMemberByIdUseCase

describe('(UC) - Get Institution Member By Id', () => {
  beforeEach(() => {
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    sut = new GetInstitutionMemberByIdUseCase(institutionMembersRepository)
  })

  it('should able to get an institution member by id as manager', async () => {
    const actorId = new UniqueEntityId().toString()
    const institutionId = new UniqueEntityId().toString()

    const { member: manager } = makeInstitutionMember({
      institutionId,
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    const { member } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.STUDENT,
    })
    institutionMembersRepository.items.push(manager, member)

    const result = await sut.execute({
      memberId: member.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.member.id).toEqual(member.id)
    }
  })

  it('should not be able to get a member when not authorized', async () => {
    const { member } = makeInstitutionMember()
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({
      memberId: member.id.toString(),
      actorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedToManageInstitutionError)
    }
  })

  it('should not be able to get a member that does not exist', async () => {
    const result = await sut.execute({
      memberId: 'non-existent',
      actorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionMemberNotFoundError)
    }
  })
})
