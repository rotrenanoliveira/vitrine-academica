import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { type PreferenceTag, PreferenceTagStatus } from '../../../enterprise/entities/preference-tag'
import { PreferenceTagNotFoundError } from '../../_errors/preference-tag-not-found-error'
import type { PreferenceTagsRepository } from '../../repositories/preference-tags-repository'

interface DeactivatePreferenceTagUseCaseRequest {
  userId: string
  tagId: string
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

  async execute({
    userId,
    tagId,
  }: DeactivatePreferenceTagUseCaseRequest): Promise<DeactivatePreferenceTagUseCaseResponse> {
    const userResult = await this.validateUserExists(userId, tagId)

    if (userResult.isLeft()) {
      return left(userResult.value)
    }

    const preferenceTagResult = await this.findPreferenceTagOrFail(userId, tagId)

    if (preferenceTagResult.isLeft()) {
      return left(preferenceTagResult.value)
    }

    const preferenceTag = preferenceTagResult.value

    // Já está inativa: nada a fazer (operação idempotente)
    if (preferenceTag.status === PreferenceTagStatus.INACTIVE) {
      return right({ preferenceTag })
    }

    await this.deactivatePreferenceTag(preferenceTag, userId, tagId)

    return right({ preferenceTag })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'preference-tag',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async validateUserExists(userId: string, tagId: string): Promise<Either<UserNotFoundError, null>> {
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

    return right(null)
  }

  private async findPreferenceTagOrFail(
    userId: string,
    tagId: string,
  ): Promise<Either<PreferenceTagNotFoundError, PreferenceTag>> {
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

    return right(preferenceTag)
  }

  private async deactivatePreferenceTag(preferenceTag: PreferenceTag, userId: string, tagId: string) {
    preferenceTag.status = PreferenceTagStatus.INACTIVE
    await this.preferenceTagsRepository.save(preferenceTag)

    await this.log({
      actorId: userId,
      resourceId: preferenceTag.id.toString(),
      text: `Usuário ${userId} removeu a tag ${tagId} de suas preferências.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: PreferenceTagStatus.ACTIVE, new: PreferenceTagStatus.INACTIVE } },
    })
  }
}
