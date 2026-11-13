import { makeCall } from '@tests/factories/make-call'
import { makeCallApplication } from '@tests/factories/make-call-application'
import { makeCallSkill } from '@tests/factories/make-call-skill'
import { makeProject } from '@tests/factories/make-project'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryCallApplicationsRepository } from '@tests/repositories/in-memory-call-applications-repository'
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
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { InvalidCallStatusError } from '../../_errors/invalid-call-status-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import { CloseCallUseCase } from './close-call'
import { CreateProjectFromCallUseCase } from './create-project-from-call'

let callsRepository: InMemoryCallsRepository
let callSkillsRepository: InMemoryCallSkillsRepository
let callApplicationsRepository: InMemoryCallApplicationsRepository
let projectsRepository: InMemoryProjectsRepository
let projectTagsRepository: InMemoryProjectTagsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: CloseCallUseCase

describe('(UC) - Close Call', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callSkillsRepository = new InMemoryCallSkillsRepository()
    callApplicationsRepository = new InMemoryCallApplicationsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    projectTagsRepository = new InMemoryProjectTagsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    const createProjectFromCall = new CreateProjectFromCallUseCase(
      callsRepository,
      callSkillsRepository,
      callApplicationsRepository,
      projectsRepository,
      projectTagsRepository,
      projectMembersRepository,
      registerLog,
    )
    sut = new CloseCallUseCase(callsRepository, createProjectFromCall, registerLog)
  })

  it('should be able to close a call as owner', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.call.status).toBe(CallStatus.CLOSED)
    }
    expect(callsRepository.items[0].status).toBe(CallStatus.CLOSED)
  })

  it('should create a sketch project from the call and link it when the call is closed', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    expect(projectsRepository.items).toHaveLength(1)

    const project = projectsRepository.items[0]

    expect(project.title).toBe(call.title)
    expect(project.description).toBe(call.description)
    expect(project.author.toString()).toBe(call.authorId.toString())
    expect(project.status).toBe(ProjectStatus.SKETCH)
    if (result.isRight()) {
      expect(result.value.call.projectId?.toString()).toBe(project.id.toString())
    }
    expect(callsRepository.items[0].projectId?.toString()).toBe(project.id.toString())
  })

  it('should add the tags of the skills and only the approved applicants to the project', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const tagId = new UniqueEntityId()
    const { callSkill } = makeCallSkill({ callId: call.id, tagId })
    callSkillsRepository.items.push(callSkill)

    const approvedId = new UniqueEntityId()
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
    callApplicationsRepository.items.push(approved, rejected, pending)

    await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(projectsRepository.items[0].tags).toEqual([tagId.toString()])
    expect(projectTagsRepository.items).toHaveLength(1)
    expect(projectMembersRepository.items).toHaveLength(1)
    expect(projectMembersRepository.items[0].userId.toString()).toBe(approvedId.toString())
    expect(projectMembersRepository.items[0].status).toBe(ProjectMemberStatus.ACCEPTED)
  })

  it('should not create another project when the call is already linked to one', async () => {
    const { call } = makeCall()
    const { project: existing } = makeProject({ author: call.authorId })
    projectsRepository.items.push(existing)
    call.linkProject(existing.id)
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    expect(projectsRepository.items).toHaveLength(1)
    expect(callsRepository.items[0].projectId?.toString()).toBe(existing.id.toString())
    expect(callsRepository.items[0].status).toBe(CallStatus.CLOSED)
  })

  it('should register audit logs for the created project and for the closed call', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(auditLogsRepository.items).toHaveLength(2)
    expect(auditLogsRepository.items.map((log) => log.action)).toEqual(
      expect.arrayContaining([AuditLogAction.CREATE, AuditLogAction.UPDATE]),
    )
    expect(auditLogsRepository.items.every((log) => log.status === AuditLogStatus.SUCCESS)).toBe(true)
  })

  it('should not be able to close a call as non-owner', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(callsRepository.items[0].status).toBe(CallStatus.OPEN)
    expect(projectsRepository.items).toHaveLength(0)
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotCallOwnerError)
    }
  })

  it('should not be able to close a call that does not exist', async () => {
    const result = await sut.execute({ callId: 'non-existent', authorId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(projectsRepository.items).toHaveLength(0)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotFoundError)
    }
  })

  it('should not be able to close a call that is already closed', async () => {
    const { call } = makeCall()
    call.close()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(projectsRepository.items).toHaveLength(0)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCallStatusError)
    }
  })
})
