import { type Either, left, right } from '@/core/either'
import type { User } from '@/domain/identity/enterprise/entities/user'
import { AccountNotFoundError } from '../../_errors/account-not-found-error'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import type { AccountsRepository } from '../../repositories/accounts-repository'
import type { UsersRepository } from '../../repositories/users-repository'

interface FindUserByIdUseCaseRequest {
  userId: string
}

type FindUserByIdUseCaseResponse = Either<UserNotFoundError, { user: User; accountId: string }>

export class FindUserByIdUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private accountsRepository: AccountsRepository,
  ) {}

  async execute({ userId }: FindUserByIdUseCaseRequest): Promise<FindUserByIdUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new UserNotFoundError())
    }

    const account = await this.accountsRepository.findByUserId(userId)

    if (!account) {
      return left(new AccountNotFoundError())
    }

    return right({
      user,
      accountId: account.id.toString(),
    })
  }
}
