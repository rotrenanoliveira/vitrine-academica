import { type Either, left, right } from '@/core/either'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
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
    const emailAvailable = await this.isEmailAvailable(email)

    if (emailAvailable.isLeft()) {
      return left(emailAvailable.value)
    }

    const { user, accountId } = await this.createUserAccount(name, email)

    return right({
      accountId,
      user,
    })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'identity.user',
      resourceId,
      text,
      status,
      diff: diff ?? null,
    })
  }

  private async isEmailAvailable(email: string): Promise<Either<UserAlreadyExistsError, true>> {
    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      await this.log({
        actorId: userWithSameEmail.id.toString(),
        resourceId: userWithSameEmail.id.toString(),
        text: `Usuário com email ${email} já existe.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserAlreadyExistsError(email))
    }

    return right(true)
  }

  private async createUserAccount(name: string, email: string) {
    const user = User.create({ name, email })

    const account = Account.create({
      userId: user.id,
      avatarId: null,
      consentedAt: new Date(),
    })

    await this.usersRepository.create(user)

    await this.accountsRepository.create(account)

    await this.log({
      actorId: user.id.toString(),
      resourceId: user.id.toString(),
      text: `Usuário criado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
    })

    return { user, accountId: account.id }
  }
}
