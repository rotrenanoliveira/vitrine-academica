import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { PreferenceTag } from '../../../enterprise/entities/preference-tag'
import { PreferenceTagAlreadyExistsError } from '../../_errors/preference-tag-already-exists-error'
import { TagNotFoundError } from '../../_errors/tag-not-found-error'
import type { PreferenceTagsRepository } from '../../repositories/preference-tags-repository'
import type { TagsRepository } from '../../repositories/tags-repository'

interface RegisterPreferenceTagUseCaseRequest {
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

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.CREATE,
      resource: 'preference-tag',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({ userId, tagId }: RegisterPreferenceTagUseCaseRequest): Promise<RegisterPreferenceTagUseCaseResponse> {
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

    const preferenceTagAlreadyExists = await this.preferenceTagsRepository.findByUserIdAndTagId(userId, tagId)

    if (preferenceTagAlreadyExists) {
      await this.log({
        actorId: userId,
        resourceId: preferenceTagAlreadyExists.id.toString(),
        text: `Preferência de tag ${preferenceTagAlreadyExists.id.toString()} já existe.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new PreferenceTagAlreadyExistsError())
    }

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

    return right({ preferenceTag })
  }
}
