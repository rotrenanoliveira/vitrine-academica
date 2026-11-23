import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { PreferenceTag, PreferenceTagStatus } from '../../../enterprise/entities/preference-tag'
import { PreferenceTagAlreadyExistsError } from '../../_errors/preference-tag-already-exists-error'
import { TagNotFoundError } from '../../_errors/tag-not-found-error'
import type { PreferenceTagsRepository } from '../../repositories/preference-tags-repository'
import type { TagsRepository } from '../../repositories/tags-repository'

interface RegisterPreferenceTagUseCaseRequest {
  userId: string
  tagId: string
}

type RegisterPreferenceTagUseCaseResponse = Either<
  UserNotFoundError | TagNotFoundError | PreferenceTagAlreadyExistsError,
  { preferenceTag: PreferenceTag }
>

export class RegisterPreferenceTagUseCase {
  constructor(
    private readonly preferenceTagsRepository: PreferenceTagsRepository,
    private readonly tagsRepository: TagsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ userId, tagId }: RegisterPreferenceTagUseCaseRequest): Promise<RegisterPreferenceTagUseCaseResponse> {
    const userResult = await this.validateUserExists(userId, tagId)

    if (userResult.isLeft()) {
      return left(userResult.value)
    }

    const tagResult = await this.validateTagExists(tagId, userId)

    if (tagResult.isLeft()) {
      return left(tagResult.value)
    }

    const existingPreferenceTag = await this.preferenceTagsRepository.findByUserIdAndTagId(userId, tagId)

    if (existingPreferenceTag) {
      const notActiveResult = await this.validatePreferenceTagNotActive(existingPreferenceTag, userId)

      if (notActiveResult.isLeft()) {
        return left(notActiveResult.value)
      }

      await this.reactivatePreferenceTag(existingPreferenceTag, userId, tagId)

      return right({ preferenceTag: existingPreferenceTag })
    }

    const preferenceTag = await this.createPreferenceTag(userId, tagId)

    return right({ preferenceTag })
  }

  private async log({
    actorId,
    sessionId,
    resourceId,
    text,
    status,
    diff,
    action = AuditLogAction.CREATE,
  }: LogParams & { action?: AuditLogAction }) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action,
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

  private async validateTagExists(tagId: string, userId: string): Promise<Either<TagNotFoundError, null>> {
    const tag = await this.tagsRepository.findById(tagId)

    if (!tag) {
      await this.log({
        actorId: userId,
        resourceId: tagId,
        text: `Tag ${tagId} não encontrada.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new TagNotFoundError())
    }

    return right(null)
  }

  private async validatePreferenceTagNotActive(
    preferenceTag: PreferenceTag,
    userId: string,
  ): Promise<Either<PreferenceTagAlreadyExistsError, null>> {
    if (preferenceTag.status === PreferenceTagStatus.ACTIVE) {
      await this.log({
        actorId: userId,
        resourceId: preferenceTag.id.toString(),
        text: `Preferência de tag ${preferenceTag.id.toString()} já existe.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new PreferenceTagAlreadyExistsError())
    }

    return right(null)
  }

  private async reactivatePreferenceTag(preferenceTag: PreferenceTag, userId: string, tagId: string) {
    preferenceTag.status = PreferenceTagStatus.ACTIVE
    await this.preferenceTagsRepository.save(preferenceTag)

    await this.log({
      action: AuditLogAction.UPDATE,
      actorId: userId,
      resourceId: preferenceTag.id.toString(),
      text: `Usuário ${userId} reativou a tag ${tagId} em suas preferências.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: PreferenceTagStatus.INACTIVE, new: PreferenceTagStatus.ACTIVE } },
    })
  }

  private async createPreferenceTag(userId: string, tagId: string): Promise<PreferenceTag> {
    const preferenceTag = PreferenceTag.create({
      userId: new UniqueEntityId(userId),
      tagId: new UniqueEntityId(tagId),
    })

    await this.preferenceTagsRepository.create(preferenceTag)

    await this.log({
      actorId: userId,
      resourceId: preferenceTag.id.toString(),
      text: `Usuário ${userId} adicionou a tag ${tagId} às suas preferências.`,
      status: AuditLogStatus.SUCCESS,
    })

    return preferenceTag
  }
}
