import { type Either, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMember, ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
import type { Call } from '../../../enterprise/entities/call'
import { CallApplicationStatus } from '../../../enterprise/entities/call-application'
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
    if (call.projectId) {
      const existingProject = await this.projectsRepository.findById(call.projectId.toString())

      if (existingProject) {
        return right({ project: existingProject })
      }
    }

    const callId = call.id.toString()

    const [skills, approvedApplications] = await Promise.all([
      this.callSkillsRepository.findManyByCallId(callId),
      this.callApplicationsRepository.findManyByCallId(callId, CallApplicationStatus.APPROVED),
    ])

    const tagIds = new Map(skills.map((skill) => [skill.tagId.toString(), skill.tagId]))

    const project = Project.create({
      title: call.title,
      description: call.description,
      author: call.authorId,
      status: ProjectStatus.SKETCH,
      attachments: [],
      tags: [...tagIds.keys()],
    })

    const projectTags = [...tagIds.values()].map((tagId) => ProjectTag.create({ projectId: project.id, tagId }))

    const projectMembers = approvedApplications.map((application) =>
      ProjectMember.create({
        projectId: project.id,
        userId: application.applicantId,
        status: ProjectMemberStatus.ACCEPTED,
      }),
    )

    call.linkProject(project.id)

    await this.callProjectCreationRepository.createProjectFromCall({ project, projectTags, projectMembers, call })

    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.CREATE,
      resource: 'project',
      resourceId: project.id.toString(),
      diff: {
        title: { old: null, new: project.title },
        description: { old: null, new: project.description },
        authorId: { old: null, new: call.authorId.toString() },
        tags: { old: null, new: project.tags },
        callId: { old: null, new: callId },
        members: { old: null, new: approvedApplications.map((application) => application.applicantId.toString()) },
      },
      status: AuditLogStatus.SUCCESS,
      text: `Projeto ${project.id.toString()} criado a partir do chamado ${callId}.`,
    })

    return right({ project })
  }
}
