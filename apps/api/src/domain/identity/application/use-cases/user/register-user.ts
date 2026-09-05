import { type Either, left, right } from '@/core/either'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Account } from '@/domain/identity/enterprise/entities/account'
import { User } from '@/domain/identity/enterprise/entities/user'
import { UserAlreadyExistsError } from '../../_errors/user-already-exists-error'
import type { AccountsRepository } from '../../repositories/accounts-repository'
import type { UsersRepository } from '../../repositories/users-repository'

interface RegisterUserUseCaseRequest {
  name: string
  email: string
}

type RegisterUserUseCaseResponse = Either<UserAlreadyExistsError, { user: User; accountId: UniqueEntityId }>

export class RegisterUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
  ) {}

  async execute({ name, email }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      return left(new UserAlreadyExistsError(email))
    }

    const user = User.create({ name, email })

    const account = Account.create({
      userId: user.id,
      avatarId: null,
      consentedAt: new Date(),
    })

    await this.usersRepository.create(user)
    await this.accountsRepository.create(account)

    return right({ user, accountId: account.id })
  }
}
