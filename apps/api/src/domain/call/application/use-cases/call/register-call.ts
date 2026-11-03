import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import { Call } from '../../../enterprise/entities/call'
import { CallSkill } from '../../../enterprise/entities/call-skill'
import { CallSkillsRequiredError } from '../../_errors/call-skills-required-error'
import { InvalidCallDeadlineError } from '../../_errors/invalid-call-deadline-error'
import type { CallSkillInput } from '../../dtos/call-skill-input'
import type { CallWithSkills } from '../../dtos/call-with-skills'
import { dedupeCallSkills } from '../../helpers/dedupe-call-skills'
import type { CallSkillsRepository } from '../../repositories/call-skills-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

interface RegisterCallUseCaseRequest {
  authorId: string
  title: string
  description: string
  applicationDeadline: Date
  skills: CallSkillInput[]
  date?: Date
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type RegisterCallUseCaseResponse = Either<
  CallSkillsRequiredError | InvalidCallDeadlineError | TagNotFoundError,
  CallWithSkills
>

export class RegisterCallUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callSkillsRepository: CallSkillsRepository,
    private readonly tagsRepository: TagsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.CREATE,
      resource: 'call',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    authorId,
    title,
    description,
    applicationDeadline,
    skills,
    date = new Date(),
  }: RegisterCallUseCaseRequest): Promise<RegisterCallUseCaseResponse> {
    const uniqueSkills = dedupeCallSkills(skills)

    if (uniqueSkills.length === 0) {
      await this.log({
        actorId: authorId,
        resourceId: authorId,
        text: `Usuário ${authorId} tentou criar um chamado sem habilidades.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CallSkillsRequiredError())
    }

    if (applicationDeadline <= date) {
      await this.log({
        actorId: authorId,
        resourceId: authorId,
        text: `Prazo ${applicationDeadline.toISOString()} inválido para um novo chamado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidCallDeadlineError())
    }

    for (const skill of uniqueSkills) {
      const tag = await this.tagsRepository.findById(skill.tagId)

      if (!tag) {
        await this.log({
          actorId: authorId,
          resourceId: skill.tagId,
          text: `Tag ${skill.tagId} não encontrada.`,
          status: AuditLogStatus.FAILURE,
        })

        return left(new TagNotFoundError())
      }
    }

    const call = Call.create({
      authorId: new UniqueEntityId(authorId),
      title,
      description,
      applicationDeadline,
    })

    const callSkills = uniqueSkills.map((skill) =>
      CallSkill.create({
        callId: call.id,
        tagId: new UniqueEntityId(skill.tagId),
        description: skill.description ?? null,
      }),
    )

    await this.callsRepository.create(call)
    await this.callSkillsRepository.createMany(callSkills)

    await this.log({
      actorId: authorId,
      resourceId: call.id.toString(),
      text: `Chamado ${call.id.toString()} criado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: {
        title: { old: null, new: title },
        description: { old: null, new: description },
        applicationDeadline: { old: null, new: applicationDeadline.toISOString() },
        skills: { old: null, new: uniqueSkills.map((skill) => skill.tagId) },
      },
    })

    return right({ call, skills: callSkills })
  }
}
