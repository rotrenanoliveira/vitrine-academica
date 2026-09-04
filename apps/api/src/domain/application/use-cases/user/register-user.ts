import { type Either, left, right } from '@/core/either'
import { User } from '@/domain/enterprise/entities/user'
import { UserAlreadyExistsError } from '../../_errors/user-already-exists-error'
import type { UsersRepository } from '../../repositories/users-repository'

interface RegisterUserUseCaseRequest {
  name: string
  email: string
}

type RegisterUserUseCaseResponse = Either<UserAlreadyExistsError, { user: User }>

export class RegisterUserUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ name, email }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      return left(new UserAlreadyExistsError(email))
    }

    const user = User.create({ name, email })

    await this.usersRepository.create(user)

    return right({ user })
  }
}
