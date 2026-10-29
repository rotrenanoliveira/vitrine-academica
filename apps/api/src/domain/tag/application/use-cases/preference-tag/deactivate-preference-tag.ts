import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { type PreferenceTag, PreferenceTagStatus } from '../../../enterprise/entities/preference-tag'
import { PreferenceTagNotFoundError } from '../../_errors/preference-tag-not-found-error'
import type { PreferenceTagsRepository } from '../../repositories/preference-tags-repository'

interface DeactivatePreferenceTagUseCaseRequest {
  userId: string
  tagId: string
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type DeactivatePreferenceTagUseCaseResponse = Either<
  UserNotFoundError | PreferenceTagNotFoundError,
  { preferenceTag: PreferenceTag }
>

export class DeactivatePreferenceTagUseCase {
  constructor(
    private readonly preferenceTagsRepository: PreferenceTagsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'preference-tag',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    userId,
    tagId,
  }: DeactivatePreferenceTagUseCaseRequest): Promise<DeactivatePreferenceTagUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      await this.log({
        actorId: userId,
        resourceId: tagId,
        text: `Usuário ${userId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserNotFoundError())
    }

    const preferenceTag = await this.preferenceTagsRepository.findByUserIdAndTagId(userId, tagId)

    if (!preferenceTag) {
      await this.log({
        actorId: userId,
        resourceId: tagId,
        text: `Usuário ${userId} não possui preferência pela tag ${tagId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new PreferenceTagNotFoundError())
    }

    // Já está inativa: nada a fazer (operação idempotente)
    if (preferenceTag.status === PreferenceTagStatus.INACTIVE) {
      return right({ preferenceTag })
    }

    preferenceTag.status = PreferenceTagStatus.INACTIVE
    await this.preferenceTagsRepository.save(preferenceTag)

    await this.log({
      actorId: userId,
      resourceId: preferenceTag.id.toString(),
      text: `Usuário ${userId} removeu a tag ${tagId} de suas preferências.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: PreferenceTagStatus.ACTIVE, new: PreferenceTagStatus.INACTIVE } },
    })

    return right({ preferenceTag })
  }
}
