import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import { CallSkill } from '../../../enterprise/entities/call-skill'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { CallSkillsRequiredError } from '../../_errors/call-skills-required-error'
import { InvalidCallDeadlineError } from '../../_errors/invalid-call-deadline-error'
import { InvalidCallStatusError } from '../../_errors/invalid-call-status-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import type { CallSkillInput } from '../../dtos/call-skill-input'
import type { CallWithSkills } from '../../dtos/call-with-skills'
import { dedupeCallSkills } from '../../helpers/dedupe-call-skills'
import type { CallSkillsRepository } from '../../repositories/call-skills-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

interface UpdateCallUseCaseRequest {
  callId: string
  authorId: string
  title: string
  description: string
  applicationDeadline: Date
  skills?: CallSkillInput[]
  date?: Date
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type UpdateCallUseCaseResponse = Either<
  | CallNotFoundError
  | NotCallOwnerError
  | InvalidCallStatusError
  | InvalidCallDeadlineError
  | CallSkillsRequiredError
  | TagNotFoundError,
  CallWithSkills
>

export class UpdateCallUseCase {
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
      action: AuditLogAction.UPDATE,
      resource: 'call',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    callId,
    authorId,
    title,
    description,
    applicationDeadline,
    skills,
    date = new Date(),
  }: UpdateCallUseCaseRequest): Promise<UpdateCallUseCaseResponse> {
    const call = await this.callsRepository.findById(callId)

    if (!call) {
      await this.log({
        actorId: authorId,
        resourceId: callId,
        text: `Chamado ${callId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CallNotFoundError())
    }

    if (call.authorId.toString() !== authorId) {
      await this.log({
        actorId: authorId,
        resourceId: callId,
        text: `Usuário ${authorId} não tem permissão para atualizar o chamado ${callId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotCallOwnerError())
    }

    if (!call.isOpen()) {
      await this.log({
        actorId: authorId,
        resourceId: callId,
        text: `Chamado ${callId} não pode ser editado com o status ${call.status}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidCallStatusError('Somente chamados abertos podem ser editados'))
    }

    const deadlineChanged = applicationDeadline.getTime() !== call.applicationDeadline.getTime()

    if (deadlineChanged && applicationDeadline <= date) {
      await this.log({
        actorId: authorId,
        resourceId: callId,
        text: `Prazo ${applicationDeadline.toISOString()} inválido para o chamado ${callId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidCallDeadlineError())
    }

    const currentSkills = await this.callSkillsRepository.findManyByCallId(callId)
    let nextSkills: CallSkill[] | null = null

    if (skills !== undefined) {
      const uniqueSkills = dedupeCallSkills(skills)

      if (uniqueSkills.length === 0) {
        await this.log({
          actorId: authorId,
          resourceId: callId,
          text: `Chamado ${callId} não pode ficar sem habilidades.`,
          status: AuditLogStatus.FAILURE,
        })

        return left(new CallSkillsRequiredError())
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

      nextSkills = uniqueSkills.map((skill) =>
        CallSkill.create({
          callId: call.id,
          tagId: new UniqueEntityId(skill.tagId),
          description: skill.description ?? null,
        }),
      )
    }

    const diff: Record<string, { old: unknown; new: unknown }> = {
      title: { old: call.title, new: title },
      description: { old: call.description, new: description },
      applicationDeadline: {
        old: call.applicationDeadline.toISOString(),
        new: applicationDeadline.toISOString(),
      },
    }

    if (nextSkills) {
      diff.skills = {
        old: currentSkills.map((skill) => skill.tagId.toString()),
        new: nextSkills.map((skill) => skill.tagId.toString()),
      }
    }

    call.title = title
    call.description = description
    call.applicationDeadline = applicationDeadline

    await this.callsRepository.save(call)

    if (nextSkills) {
      await this.callSkillsRepository.deleteManyByCallId(callId)
      await this.callSkillsRepository.createMany(nextSkills)
    }

    await this.log({
      actorId: authorId,
      resourceId: callId,
      text: `Chamado ${callId} atualizado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff,
    })

    return right({ call, skills: nextSkills ?? currentSkills })
  }
}
