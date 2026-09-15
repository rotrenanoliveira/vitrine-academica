import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole, InstitutionMemberStatus } from '../../../enterprise/entities/institution-member'
import { InstitutionMemberNotFoundError } from '../../_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { UpdateInstitutionMemberStatusUseCase } from './update-institution-member-status'

let institutionMembersRepository: InMemoryInstitutionMembersRepository
let sut: UpdateInstitutionMemberStatusUseCase

describe('(UC) - Update Institution Member Status', () => {
  beforeEach(() => {
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    sut = new UpdateInstitutionMemberStatusUseCase(institutionMembersRepository)
  })

  it('should able to update institution member status as manager', async () => {
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
      status: InstitutionMemberStatus.SUSPENDED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.member.status).toBe(InstitutionMemberStatus.SUSPENDED)
    }
  })

  it('should not be able to update member status when not authorized', async () => {
    const { member } = makeInstitutionMember()
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({
      memberId: member.id.toString(),
      actorId: new UniqueEntityId().toString(),
      status: InstitutionMemberStatus.INACTIVE,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedToManageInstitutionError)
    }
  })

  it('should not be able to update status of a member that does not exist', async () => {
    const result = await sut.execute({
      memberId: 'non-existent',
      actorId: new UniqueEntityId().toString(),
      status: InstitutionMemberStatus.INACTIVE,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionMemberNotFoundError)
    }
  })
})
