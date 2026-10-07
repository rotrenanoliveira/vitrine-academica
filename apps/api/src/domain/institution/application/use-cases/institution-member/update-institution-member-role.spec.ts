import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { InstitutionMemberRole, InstitutionMemberStatus } from '../../../enterprise/entities/institution-member'
import { CannotRemoveLastInstitutionManagerError } from '../../_errors/cannot-remove-last-institution-manager-error'
import { InstitutionMemberNotFoundError } from '../../_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { UpdateInstitutionMemberRoleUseCase } from './update-institution-member-role'

let institutionMembersRepository: InMemoryInstitutionMembersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: UpdateInstitutionMemberRoleUseCase

describe('(UC) - Update Institution Member Role', () => {
  beforeEach(() => {
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new UpdateInstitutionMemberRoleUseCase(institutionMembersRepository, registerLog)
  })

  it('should be able to promote a member to manager', async () => {
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
      role: InstitutionMemberRole.MANAGER,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.member.role).toBe(InstitutionMemberRole.MANAGER)
    }
  })

  it('should register an audit log when the role is updated', async () => {
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

    await sut.execute({
      memberId: member.id.toString(),
      actorId,
      role: InstitutionMemberRole.MANAGER,
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should not be able to update role when not authorized', async () => {
    const { member } = makeInstitutionMember({ role: InstitutionMemberRole.STUDENT })
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({
      memberId: member.id.toString(),
      actorId: new UniqueEntityId().toString(),
      role: InstitutionMemberRole.MANAGER,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedToManageInstitutionError)
    }
  })

  it('should not be able to update role of a member that does not exist', async () => {
    const result = await sut.execute({
      memberId: 'non-existent',
      actorId: new UniqueEntityId().toString(),
      role: InstitutionMemberRole.MANAGER,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InstitutionMemberNotFoundError)
    }
  })

  it('should not be able to demote the only active manager of the institution', async () => {
    const institutionId = new UniqueEntityId().toString()

    const { member: manager } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const result = await sut.execute({
      memberId: manager.id.toString(),
      actorId: manager.userId,
      role: InstitutionMemberRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CannotRemoveLastInstitutionManagerError)
    }
    expect(manager.role).toBe(InstitutionMemberRole.MANAGER)
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
  })

  it('should be able to demote a manager when there is another active manager', async () => {
    const institutionId = new UniqueEntityId().toString()

    const { member: manager } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.MANAGER,
    })
    const { member: otherManager } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager, otherManager)

    const result = await sut.execute({
      memberId: manager.id.toString(),
      actorId: manager.userId,
      role: InstitutionMemberRole.STUDENT,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.member.role).toBe(InstitutionMemberRole.STUDENT)
    }
  })

  it('should not count an inactive manager as an active manager when demoting', async () => {
    const institutionId = new UniqueEntityId().toString()

    const { member: manager } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.MANAGER,
    })
    const { member: inactiveManager } = makeInstitutionMember({
      institutionId,
      role: InstitutionMemberRole.MANAGER,
      status: InstitutionMemberStatus.INACTIVE,
    })
    institutionMembersRepository.items.push(manager, inactiveManager)

    const result = await sut.execute({
      memberId: manager.id.toString(),
      actorId: manager.userId,
      role: InstitutionMemberRole.STUDENT,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CannotRemoveLastInstitutionManagerError)
    }
  })
})
