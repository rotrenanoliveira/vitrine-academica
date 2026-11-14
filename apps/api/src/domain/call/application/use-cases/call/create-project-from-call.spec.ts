import { makeCall } from '@tests/factories/make-call'
import { makeCallApplication } from '@tests/factories/make-call-application'
import { makeCallSkill } from '@tests/factories/make-call-skill'
import { makeProject } from '@tests/factories/make-project'
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
import { type Call, CallStatus } from '../../../enterprise/entities/call'
import { CallApplicationStatus } from '../../../enterprise/entities/call-application'
import { CreateProjectFromCallUseCase } from './create-project-from-call'

let callsRepository: InMemoryCallsRepository
let callSkillsRepository: InMemoryCallSkillsRepository
let callApplicationsRepository: InMemoryCallApplicationsRepository
let projectsRepository: InMemoryProjectsRepository
let projectTagsRepository: InMemoryProjectTagsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let callProjectCreationRepository: InMemoryCallProjectCreationRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: CreateProjectFromCallUseCase

function addCall(): Call {
  const { call } = makeCall()
  callsRepository.items.push(call)

  return call
}

function addSkill(call: Call, tagId = new UniqueEntityId()) {
  const { callSkill } = makeCallSkill({ callId: call.id, tagId })
  callSkillsRepository.items.push(callSkill)

  return tagId
}

function addApplication(call: Call, status: CallApplicationStatus) {
  const applicantId = new UniqueEntityId()
  const { application } = makeCallApplication({ callId: call.id, applicantId, status })
  callApplicationsRepository.items.push(application)

  return applicantId
}

describe('(UC) - Create Project From Call', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callSkillsRepository = new InMemoryCallSkillsRepository()
    callApplicationsRepository = new InMemoryCallApplicationsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    projectTagsRepository = new InMemoryProjectTagsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    callProjectCreationRepository = new InMemoryCallProjectCreationRepository(
      callsRepository,
      projectsRepository,
      projectTagsRepository,
      projectMembersRepository,
    )
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new CreateProjectFromCallUseCase(
      callSkillsRepository,
      callApplicationsRepository,
      projectsRepository,
      callProjectCreationRepository,
      registerLog,
    )
  })

  it('should be able to create a sketch project with the data of the call', async () => {
    const call = addCall()

    const result = await sut.execute({ call, actorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      const { project } = result.value

      expect(project.title).toBe(call.title)
      expect(project.description).toBe(call.description)
      expect(project.author.toString()).toBe(call.authorId.toString())
      expect(project.status).toBe(ProjectStatus.SKETCH)
      expect(project.attachments).toEqual([])
    }
    expect(projectsRepository.items).toHaveLength(1)
  })

  it('should create the project only with the author when there are no approved applications', async () => {
    const call = addCall()
    addApplication(call, CallApplicationStatus.PENDING)
    addApplication(call, CallApplicationStatus.REJECTED)

    const result = await sut.execute({ call, actorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    expect(projectsRepository.items).toHaveLength(1)
    expect(projectMembersRepository.items).toHaveLength(0)
  })

  it('should turn only approved applications into accepted members of the project', async () => {
    const call = addCall()
    const otherCall = addCall()
    const approvedA = addApplication(call, CallApplicationStatus.APPROVED)
    const approvedB = addApplication(call, CallApplicationStatus.APPROVED)
    addApplication(call, CallApplicationStatus.REJECTED)
    addApplication(call, CallApplicationStatus.PENDING)
    addApplication(otherCall, CallApplicationStatus.APPROVED)

    const result = await sut.execute({ call, actorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      const projectId = result.value.project.id.toString()

      expect(projectMembersRepository.items).toHaveLength(2)
      expect(projectMembersRepository.items.map((member) => member.userId.toString())).toEqual(
        expect.arrayContaining([approvedA.toString(), approvedB.toString()]),
      )
      expect(
        projectMembersRepository.items.every(
          (member) => member.projectId.toString() === projectId && member.status === ProjectMemberStatus.ACCEPTED,
        ),
      ).toBe(true)
    }
  })

  it('should fill the tags of the project without repeating tags shared between skills', async () => {
    const call = addCall()
    const otherCall = addCall()
    const tagA = new UniqueEntityId()
    const tagB = new UniqueEntityId()
    addSkill(call, tagA)
    addSkill(call, tagB)
    addSkill(call, tagA)
    addSkill(otherCall)

    const result = await sut.execute({ call, actorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      const projectId = result.value.project.id.toString()

      expect(result.value.project.tags).toEqual([tagA.toString(), tagB.toString()])
      expect(projectTagsRepository.items).toHaveLength(2)
      expect(projectTagsRepository.items.map((projectTag) => projectTag.tagId.toString())).toEqual(
        expect.arrayContaining([tagA.toString(), tagB.toString()]),
      )
      expect(projectTagsRepository.items.every((projectTag) => projectTag.projectId.toString() === projectId)).toBe(
        true,
      )
    }
  })

  it('should link the project to the call without closing it', async () => {
    const call = addCall()

    const result = await sut.execute({ call, actorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(callsRepository.items[0].projectId?.toString()).toBe(result.value.project.id.toString())
    }
    expect(callsRepository.items[0].status).toBe(CallStatus.OPEN)
  })

  it('should return the existing project when the call is already linked to one', async () => {
    const call = addCall()
    const { project: existing } = makeProject({ author: call.authorId })
    projectsRepository.items.push(existing)
    call.linkProject(existing.id)
    addSkill(call)
    addApplication(call, CallApplicationStatus.APPROVED)

    const result = await sut.execute({ call, actorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.id.toString()).toBe(existing.id.toString())
    }
    expect(projectsRepository.items).toHaveLength(1)
    expect(projectTagsRepository.items).toHaveLength(0)
    expect(projectMembersRepository.items).toHaveLength(0)
    expect(auditLogsRepository.items).toHaveLength(0)
  })

  it('should not create another project when executed twice for the same call', async () => {
    const call = addCall()
    addSkill(call)
    addApplication(call, CallApplicationStatus.APPROVED)

    const first = await sut.execute({ call, actorId: call.authorId.toString() })
    const second = await sut.execute({ call, actorId: 'internal-system' })

    expect(first.isRight()).toBeTruthy()
    expect(second.isRight()).toBeTruthy()
    if (first.isRight() && second.isRight()) {
      expect(second.value.project.id.toString()).toBe(first.value.project.id.toString())
    }
    expect(projectsRepository.items).toHaveLength(1)
    expect(projectTagsRepository.items).toHaveLength(1)
    expect(projectMembersRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items).toHaveLength(1)
  })

  it('should register an audit log when the project is created', async () => {
    const call = addCall()

    await sut.execute({ call, actorId: 'internal-system' })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.CREATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should not create anything nor register a log when saving the project fails', async () => {
    const call = addCall()
    addSkill(call)
    addApplication(call, CallApplicationStatus.APPROVED)
    vi.spyOn(callProjectCreationRepository, 'createProjectFromCall').mockRejectedValueOnce(new Error('falha de teste'))

    await expect(sut.execute({ call, actorId: call.authorId.toString() })).rejects.toThrow('falha de teste')

    expect(projectsRepository.items).toHaveLength(0)
    expect(projectTagsRepository.items).toHaveLength(0)
    expect(projectMembersRepository.items).toHaveLength(0)
    expect(auditLogsRepository.items).toHaveLength(0)
  })

  it('should create the project on the next attempt after a failure', async () => {
    const call = addCall()
    addSkill(call)
    const approved = addApplication(call, CallApplicationStatus.APPROVED)
    vi.spyOn(callProjectCreationRepository, 'createProjectFromCall').mockRejectedValueOnce(new Error('falha de teste'))

    await expect(sut.execute({ call, actorId: call.authorId.toString() })).rejects.toThrow('falha de teste')
    const result = await sut.execute({ call, actorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    expect(projectsRepository.items).toHaveLength(1)
    expect(projectTagsRepository.items).toHaveLength(1)
    expect(projectMembersRepository.items).toHaveLength(1)
    expect(projectMembersRepository.items[0].userId.toString()).toBe(approved.toString())
    expect(auditLogsRepository.items).toHaveLength(1)
  })
})
