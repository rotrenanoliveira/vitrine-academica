import { type Either, right } from '@/core/either'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMember, ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
import type { Call } from '../../../enterprise/entities/call'
import { type CallApplication, CallApplicationStatus } from '../../../enterprise/entities/call-application'
import type { CallSkill } from '../../../enterprise/entities/call-skill'
import type { CallApplicationsRepository } from '../../repositories/call-applications-repository'
import type { CallProjectCreationRepository } from '../../repositories/call-project-creation-repository'
import type { CallSkillsRepository } from '../../repositories/call-skills-repository'

interface CreateProjectFromCallUseCaseRequest {
  call: Call
  actorId: string
}

type CreateProjectFromCallUseCaseResponse = Either<never, { project: Project }>

export class CreateProjectFromCallUseCase {
  constructor(
    private readonly callSkillsRepository: CallSkillsRepository,
    private readonly callApplicationsRepository: CallApplicationsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly callProjectCreationRepository: CallProjectCreationRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ call, actorId }: CreateProjectFromCallUseCaseRequest): Promise<CreateProjectFromCallUseCaseResponse> {
    const existingProject = await this.findExistingProject(call)

    if (existingProject) {
      return right({ project: existingProject })
    }

    const callId = call.id.toString()

    const { skills, approvedApplications } = await this.loadCallData(callId)

    const tagIds = this.mapUniqueTagIds(skills)
    const project = this.buildProject(call, tagIds)
    const projectTags = this.buildProjectTags(project, tagIds)
    const projectMembers = this.buildProjectMembers(project, approvedApplications)

    call.linkProject(project.id)

    await this.callProjectCreationRepository.createProjectFromCall({ project, projectTags, projectMembers, call })

    await this.log({
      actorId,
      resourceId: project.id.toString(),
      text: `Projeto ${project.id.toString()} criado a partir do chamado ${callId}.`,
      status: AuditLogStatus.SUCCESS,
      diff: {
        title: { old: null, new: project.title },
        description: { old: null, new: project.description },
        authorId: { old: null, new: call.authorId.toString() },
        tags: { old: null, new: project.tags },
        callId: { old: null, new: callId },
        members: { old: null, new: approvedApplications.map((application) => application.applicantId.toString()) },
      },
    })

    return right({ project })
  }

  private async log({ actorId, resourceId, sessionId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'project',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findExistingProject(call: Call): Promise<Project | null> {
    if (!call.projectId) {
      return null
    }

    return this.projectsRepository.findById(call.projectId.toString())
  }

  private async loadCallData(
    callId: string,
  ): Promise<{ skills: CallSkill[]; approvedApplications: CallApplication[] }> {
    const [skills, approvedApplications] = await Promise.all([
      this.callSkillsRepository.findManyByCallId(callId),
      this.callApplicationsRepository.findManyByCallId(callId, CallApplicationStatus.APPROVED),
    ])

    return { skills, approvedApplications }
  }

  private mapUniqueTagIds(skills: CallSkill[]): Map<string, UniqueEntityId> {
    return new Map(skills.map((skill) => [skill.tagId.toString(), skill.tagId]))
  }

  private buildProject(call: Call, tagIds: Map<string, UniqueEntityId>): Project {
    return Project.create({
      title: call.title,
      description: call.description,
      author: call.authorId,
      status: ProjectStatus.SKETCH,
      attachments: [],
      tags: [...tagIds.keys()],
    })
  }

  private buildProjectTags(project: Project, tagIds: Map<string, UniqueEntityId>): ProjectTag[] {
    return [...tagIds.values()].map((tagId) => ProjectTag.create({ projectId: project.id, tagId }))
  }

  private buildProjectMembers(project: Project, approvedApplications: CallApplication[]): ProjectMember[] {
    return approvedApplications.map((application) =>
      ProjectMember.create({
        projectId: project.id,
        userId: application.applicantId,
        status: ProjectMemberStatus.ACCEPTED,
      }),
    )
  }
}
