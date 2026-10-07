import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequest } from '@tests/factories/make-institution-membership-request'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryInstitutionMembershipRequestsRepository } from '@tests/repositories/in-memory-institution-membership-requests-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import {
  InstitutionMembershipRequestRole,
  InstitutionMembershipRequestStatus,
} from '../../../enterprise/entities/institution-membership-request'
import { InstitutionMembershipRequestNotFoundError } from '../../_errors/institution-membership-request-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { ApproveInstitutionMembershipRequestUseCase } from './approve-institution-membership-request'

let institutionMembershipRequestsRepository: InMemoryInstitutionMembershipRequestsRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: ApproveInstitutionMembershipRequestUseCase

describe('(UC) - Approve Institution Membership Request', () => {
  beforeEach(() => {
    institutionMembershipRequestsRepository = new InMemoryInstitutionMembershipRequestsRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new ApproveInstitutionMembershipRequestUseCase(
      institutionMembershipRequestsRepository,
      institutionMembersRepository,
      registerLog,
    )
  })

  it('should able to approve a membership request and create member', async () => {
    const actorId = new UniqueEntityId().toString()
    const institutionId = new UniqueEntityId().toString()
    const userId = new UniqueEntityId().toString()

    const { member: manager } = makeInstitutionMember({
      institutionId,
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const { request } = makeInstitutionMembershipRequest({
      institutionId,
      userId,
      role: InstitutionMembershipRequestRole.STUDENT,
    })
    institutionMembershipRequestsRepository.items.push(request)

    const result = await sut.execute({
      requestId: request.id.toString(),
      actorId,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.request.status).toBe(InstitutionMembershipRequestStatus.APPROVED)
      expect(result.value.member.userId).toBe(userId)
      expect(result.value.member.role).toBe(InstitutionMemberRole.STUDENT)
      expect(institutionMembersRepository.items).toHaveLength(2)
    }
  })

  it('should register an audit log when a membership request is approved', async () => {
    const actorId = new UniqueEntityId().toString()
    const institutionId = new UniqueEntityId().toString()
    const userId = new UniqueEntityId().toString()

    const { member: manager } = makeInstitutionMember({
      institutionId,
      userId: actorId,
      role: InstitutionMemberRole.MANAGER,
    })
    institutionMembersRepository.items.push(manager)

    const { request } = makeInstitutionMembershipRequest({
      institutionId,
      userId,
      role: InstitutionMembershipRequestRole.STUDENT,
    })
    institutionMembershipRequestsRepository.items.push(request)

    await sut.execute({
      requestId: request.id.toString(),
      actorId,
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should not be able to approve a request when not authorized', async () => {
    const { request } = makeInstitutionMembershipRequest()
    institutionMembershipRequestsRepository.items.push(request)

    const result = await sut.execute({
      requestId: request.id.toString(),
      actorId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedToManageInstitutionError)
    }
  })

  it('should not be able to approve a request that does not exist', async () => {
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
