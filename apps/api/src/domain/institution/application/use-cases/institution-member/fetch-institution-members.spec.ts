import { makeInstitution } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionsRepository } from '@tests/repositories/in-memory-institutions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { FetchInstitutionMembersUseCase } from './fetch-institution-members'

let institutionsRepository: InMemoryInstitutionsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let usersRepository: InMemoryUsersRepository
let sut: FetchInstitutionMembersUseCase

describe('(UC) - Fetch Institution Members', () => {
  beforeEach(() => {
    institutionsRepository = new InMemoryInstitutionsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    usersRepository = new InMemoryUsersRepository()
    sut = new FetchInstitutionMembersUseCase(institutionsRepository, institutionMembersRepository, usersRepository)
  })

  it('should able to fetch institution members as manager', async () => {
    const { user: managerUser } = makeUser()
    const { user: studentUser } = makeUser()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)
    usersRepository.items.push(managerUser, studentUser)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: managerUser.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })
    const { member: student } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: studentUser.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })
    institutionMembersRepository.items.push(manager, student)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: managerUser.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.members).toHaveLength(2)
      expect(result.value.members.map((item) => item.user.name)).toEqual(
        expect.arrayContaining([managerUser.name, studentUser.name]),
      )
    }
  })

  it('should show the name of each member', async () => {
    const { user: managerUser } = makeUser()
    const { user: studentUser } = makeUser()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)
    usersRepository.items.push(managerUser, studentUser)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: managerUser.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })
    const { member: student } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: studentUser.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })
    institutionMembersRepository.items.push(manager, student)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: managerUser.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      const studentItem = result.value.members.find((item) => item.member.id.toString() === student.id.toString())
      expect(studentItem?.user.name).toBe(studentUser.name)
    }
  })

  it('should ignore members whose user no longer exists', async () => {
    const { user: managerUser } = makeUser()
    const { institution } = makeInstitution()
    institutionsRepository.items.push(institution)
    usersRepository.items.push(managerUser)

    const { member: manager } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: managerUser.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })
    const { member: orphan } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })
    institutionMembersRepository.items.push(manager, orphan)

    const result = await sut.execute({
      institutionId: institution.id.toString(),
      actorId: managerUser.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.members).toHaveLength(1)
      expect(result.value.members[0].member.id.toString()).toBe(manager.id.toString())
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
