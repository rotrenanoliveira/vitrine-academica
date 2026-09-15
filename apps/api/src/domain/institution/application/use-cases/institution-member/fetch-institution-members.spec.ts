import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { FetchInstitutionMembersUseCase } from './fetch-institution-members'

let institutionsRepository: InMemoryInstitutionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let sut: FetchInstitutionMembersUseCase

describe('(UC) - Fetch Institution Members', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    sut = new FetchInstitutionMembersUseCase(institutionsRepository, institutionMembersRepository)
  })

  it('should able to fetch institution members as manager', async () => {
    const actorId = new UniqueEntityId().toString()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    const { member: student } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })
    institutionMembersRepository.items.push(manager, student)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.members).toHaveLength(2)
    }
  })

  it('should not be able to fetch members when not authorized', async () => {
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

  it('should not be able to fetch members of an institution that does not exist', async () => {
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
