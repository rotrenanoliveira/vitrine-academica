import { type Either, left, right } from '@/core/either'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ name, email }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      await this.registerLog.execute({
        actorId: userWithSameEmail.id.toString(),
        sessionId: null,
        action: AuditLogAction.CREATE,
        resource: 'identity.user',
        resourceId: userWithSameEmail.id.toString(),
        text: `Usuário com email ${email} já existe.`,
        status: AuditLogStatus.FAILURE,
        diff: null,
      })

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

    await this.registerLog.execute({
      actorId: user.id.toString(),
      sessionId: null,
      action: AuditLogAction.CREATE,
      resource: 'identity.user',
      resourceId: user.id.toString(),
      text: `Usuário criado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: null,
    })

    return right({ user, accountId: account.id })
  }
}
