import { type Either, left, right } from '@/core/either'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { PreferenceTag } from '../../../enterprise/entities/preference-tag'
import type { PreferenceTagsRepository } from '../../repositories/preference-tags-repository'

interface FetchUserPreferenceTagsUseCaseRequest {
  userId: string
}

type FetchUserPreferenceTagsUseCaseResponse = Either<UserNotFoundError, { preferenceTags: PreferenceTag[] }>

export class FetchUserPreferenceTagsUseCase {
  constructor(
    private readonly preferenceTagsRepository: PreferenceTagsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({ userId }: FetchUserPreferenceTagsUseCaseRequest): Promise<FetchUserPreferenceTagsUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new UserNotFoundError())
    }

    const preferenceTags = await this.preferenceTagsRepository.findByUserId(userId)

    return right({ preferenceTags })
  }
}
