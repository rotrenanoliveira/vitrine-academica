import { makeCall } from '@tests/factories/make-call'
import { makeCallApplication } from '@tests/factories/make-call-application'
import { makeCallSkill } from '@tests/factories/make-call-skill'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryCallApplicationsRepository } from '@tests/repositories/in-memory-call-applications-repository'
import { InMemoryCallProjectCreationRepository } from '@tests/repositories/in-memory-call-project-creation-repository'
import { InMemoryCallSkillsRepository } from '@tests/repositories/in-memory-call-skills-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectTagsRepository } from '@tests/repositories/in-memory-project-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { CallStatus } from '../../../enterprise/entities/call'
import { CallApplicationStatus } from '../../../enterprise/entities/call-application'
import { CloseExpiredCallsUseCase } from './close-expired-calls'
import { CreateProjectFromCallUseCase } from './create-project-from-call'

let callsRepository: InMemoryCallsRepository
let callSkillsRepository: InMemoryCallSkillsRepository
let callApplicationsRepository: InMemoryCallApplicationsRepository
let projectsRepository: InMemoryProjectsRepository
let projectTagsRepository: InMemoryProjectTagsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let callProjectCreationRepository: InMemoryCallProjectCreationRepository
let sut: CloseExpiredCallsUseCase

const now = new Date('2026-09-09T10:00:00.000Z')

function addCall(applicationDeadline: Date) {
  const { call } = makeCall({ applicationDeadline })
  callsRepository.items.push(call)

  return call
}

describe('(UC) - Close Expired Calls', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callSkillsRepository = new InMemoryCallSkillsRepository()
    callApplicationsRepository = new InMemoryCallApplicationsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    projectTagsRepository = new InMemoryProjectTagsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    callProjectCreationRepository = new InMemoryCallProjectCreationRepository(
      callsRepository,
      projectsRepository,
      projectTagsRepository,
      projectMembersRepository,
    )
    const createProjectFromCall = new CreateProjectFromCallUseCase(
      callSkillsRepository,
      callApplicationsRepository,
      projectsRepository,
      callProjectCreationRepository,
      registerLog,
    )

    sut = new CloseExpiredCallsUseCase(callsRepository, createProjectFromCall, registerLog)
  })

  it('should close an open call whose deadline has passed and create the sketch project', async () => {
    const call = addCall(new Date('2026-09-08T12:00:00.000Z'))

    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls).toHaveLength(1)
      expect(result.value.failures).toHaveLength(0)
    }
    expect(call.status).toBe(CallStatus.CLOSED)
    expect(projectsRepository.items).toHaveLength(1)
    expect(projectsRepository.items[0].status).toBe(ProjectStatus.SKETCH)
    expect(projectsRepository.items[0].title).toBe(call.title)
    expect(call.projectId?.toString()).toBe(projectsRepository.items[0].id.toString())
  })

  it('should close a call whose deadline is exactly the current time', async () => {
    const call = addCall(now)

    await sut.execute({ date: now })

    expect(call.status).toBe(CallStatus.CLOSED)
  })

  it('should not close a call that is still accepting applications', async () => {
    const call = addCall(new Date('2026-09-10T12:00:00.000Z'))

    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls).toHaveLength(0)
    }
    expect(call.status).toBe(CallStatus.OPEN)
    expect(projectsRepository.items).toHaveLength(0)
  })

  it('should not touch a call that is already closed', async () => {
    const call = addCall(new Date('2026-09-08T12:00:00.000Z'))
    call.close()

    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls).toHaveLength(0)
    }
    expect(projectsRepository.items).toHaveLength(0)
    expect(auditLogsRepository.items).toHaveLength(0)
  })

  it('should create the project with the tags of the skills and only the approved applicants', async () => {
    const call = addCall(new Date('2026-09-08T12:00:00.000Z'))
    const tagA = new UniqueEntityId()
    const tagB = new UniqueEntityId()
    const approvedId = new UniqueEntityId()
    const { callSkill: skillA } = makeCallSkill({ callId: call.id, tagId: tagA })
    const { callSkill: skillB } = makeCallSkill({ callId: call.id, tagId: tagB })
    const { application: approved } = makeCallApplication({
      callId: call.id,
      applicantId: approvedId,
      status: CallApplicationStatus.APPROVED,
    })
    const { application: rejected } = makeCallApplication({
      callId: call.id,
      status: CallApplicationStatus.REJECTED,
    })
    const { application: pending } = makeCallApplication({ callId: call.id })
    callSkillsRepository.items.push(skillA, skillB)
    callApplicationsRepository.items.push(approved, rejected, pending)

    await sut.execute({ date: now })

    expect(projectsRepository.items[0].tags).toEqual([tagA.toString(), tagB.toString()])
    expect(projectTagsRepository.items).toHaveLength(2)
    expect(projectMembersRepository.items).toHaveLength(1)
    expect(projectMembersRepository.items[0].userId.toString()).toBe(approvedId.toString())
    expect(projectMembersRepository.items[0].status).toBe(ProjectMemberStatus.ACCEPTED)
  })

  it('should close every expired call in the same run, earliest deadline first', async () => {
    const later = addCall(new Date('2026-09-08T12:00:00.000Z'))
    const earlier = addCall(new Date('2026-09-07T12:00:00.000Z'))

    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls.map((call) => call.id.toString())).toEqual([earlier.id.toString(), later.id.toString()])
    }
    expect(projectsRepository.items).toHaveLength(2)
  })

  it('should register a project log and a call log for each closed call', async () => {
    addCall(new Date('2026-09-08T12:00:00.000Z'))

    await sut.execute({ date: now })

    expect(auditLogsRepository.items).toHaveLength(2)
    expect(auditLogsRepository.items.map((log) => log.action)).toEqual(
      expect.arrayContaining([AuditLogAction.CREATE, AuditLogAction.UPDATE]),
    )
    expect(auditLogsRepository.items.every((log) => log.status === AuditLogStatus.SUCCESS)).toBe(true)
  })

  it('should keep closing the other calls when one of them fails and leave the failed one open without leftovers', async () => {
    const failing = addCall(new Date('2026-09-07T12:00:00.000Z'))
    const healthy = addCall(new Date('2026-09-08T12:00:00.000Z'))
    vi.spyOn(callProjectCreationRepository, 'createProjectFromCall').mockRejectedValueOnce(new Error('falha de teste'))

    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls.map((call) => call.id.toString())).toEqual([healthy.id.toString()])
      expect(result.value.failures).toHaveLength(1)
      expect(result.value.failures[0].callId).toBe(failing.id.toString())
    }
    expect(failing.status).toBe(CallStatus.OPEN)
    expect(healthy.status).toBe(CallStatus.CLOSED)
    expect(projectsRepository.items).toHaveLength(1)
    expect(projectsRepository.items[0].title).toBe(healthy.title)
    expect(auditLogsRepository.items.filter((log) => log.status === AuditLogStatus.FAILURE)).toHaveLength(1)
  })

  it('should close the failed call on the next run', async () => {
    const failing = addCall(new Date('2026-09-07T12:00:00.000Z'))
    addCall(new Date('2026-09-08T12:00:00.000Z'))
    vi.spyOn(callProjectCreationRepository, 'createProjectFromCall').mockRejectedValueOnce(new Error('falha de teste'))

    await sut.execute({ date: now })
    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls.map((call) => call.id.toString())).toEqual([failing.id.toString()])
      expect(result.value.failures).toHaveLength(0)
    }
    expect(failing.status).toBe(CallStatus.CLOSED)
    expect(projectsRepository.items).toHaveLength(2)
  })

  it('should return empty lists when there are no calls', async () => {
    const result = await sut.execute({ date: now })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls).toEqual([])
      expect(result.value.failures).toEqual([])
    }
  })
})
