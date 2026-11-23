import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import type { Call } from '../../../enterprise/entities/call'
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

type UpdateCallUseCaseResponse = Either<
  | CallNotFoundError
  | NotCallOwnerError
  | InvalidCallStatusError
  | InvalidCallDeadlineError
  | CallSkillsRequiredError
  | TagNotFoundError,
  CallWithSkills
>

type CallChanges = {
  title: string
  description: string
  applicationDeadline: Date
}

type CallDiff = NonNullable<LogParams['diff']>

export class UpdateCallUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callSkillsRepository: CallSkillsRepository,
    private readonly tagsRepository: TagsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    callId,
    authorId,
    title,
    description,
    applicationDeadline,
    skills,
    date = new Date(),
  }: UpdateCallUseCaseRequest): Promise<UpdateCallUseCaseResponse> {
    const callResult = await this.findEditableCall(callId, authorId)

    if (callResult.isLeft()) {
      return left(callResult.value)
    }

    const call = callResult.value

    const deadlineValidation = await this.validateDeadline(call, applicationDeadline, date, authorId)

    if (deadlineValidation.isLeft()) {
      return left(deadlineValidation.value)
    }

    const currentSkills = await this.callSkillsRepository.findManyByCallId(callId)
    const nextSkillsResult = await this.buildNextSkills(call, skills, authorId)

    if (nextSkillsResult.isLeft()) {
      return left(nextSkillsResult.value)
    }

    const nextSkills = nextSkillsResult.value
    const changes = { title, description, applicationDeadline }
    const diff = this.buildDiff(call, changes, currentSkills, nextSkills)

    await this.persistChanges(call, changes, nextSkills)

    await this.log({
      actorId: authorId,
      resourceId: callId,
      text: `Chamado ${callId} atualizado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff,
    })

    return right({ call, skills: nextSkills ?? currentSkills })
  }

  private async log({ actorId, resourceId, sessionId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'call',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findEditableCall(
    callId: string,
    authorId: string,
  ): Promise<Either<CallNotFoundError | NotCallOwnerError | InvalidCallStatusError, Call>> {
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

    return right(call)
  }

  private async validateDeadline(
    call: Call,
    applicationDeadline: Date,
    now: Date,
    authorId: string,
  ): Promise<Either<InvalidCallDeadlineError, null>> {
    const deadlineChanged = applicationDeadline.getTime() !== call.applicationDeadline.getTime()

    if (deadlineChanged && applicationDeadline <= now) {
      await this.log({
        actorId: authorId,
        resourceId: call.id.toString(),
        text: `Prazo ${applicationDeadline.toISOString()} inválido para o chamado ${call.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidCallDeadlineError())
    }

    return right(null)
  }

  private async buildNextSkills(
    call: Call,
    skills: CallSkillInput[] | undefined,
    authorId: string,
  ): Promise<Either<CallSkillsRequiredError | TagNotFoundError, CallSkill[] | null>> {
    if (skills === undefined) {
      return right(null)
    }

    const callId = call.id.toString()
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

    return right(
      uniqueSkills.map((skill) =>
        CallSkill.create({
          callId: call.id,
          tagId: new UniqueEntityId(skill.tagId),
          description: skill.description ?? null,
        }),
      ),
    )
  }

  private buildDiff(
    call: Call,
    { title, description, applicationDeadline }: CallChanges,
    currentSkills: CallSkill[],
    nextSkills: CallSkill[] | null,
  ): CallDiff {
    const diff: CallDiff = {
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

    return diff
  }

  private async persistChanges(call: Call, changes: CallChanges, nextSkills: CallSkill[] | null) {
    call.title = changes.title
    call.description = changes.description
    call.applicationDeadline = changes.applicationDeadline

    await this.callsRepository.save(call)

    if (nextSkills) {
      await this.callSkillsRepository.deleteManyByCallId(call.id.toString())
      await this.callSkillsRepository.createMany(nextSkills)
    }
  }
}
