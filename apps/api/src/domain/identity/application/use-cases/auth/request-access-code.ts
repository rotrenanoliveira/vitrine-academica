import { customAlphabet } from 'nanoid'
import { type Either, left, right } from '@/core/either'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { Mail } from '@/domain/mail/application/mail/mail'
import { accessCodeMail } from '@/domain/mail/application/mail/messages/access-code-mail'
import { AccessCode } from '../../../enterprise/entities/access-code'
import type { Account } from '../../../enterprise/entities/account'
import { type User, UserStatus } from '../../../enterprise/entities/user'
import { AccountNotFoundError } from '../../_errors/account-not-found-error'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import { UserUnavailableError } from '../../_errors/user-unavailable-error'
import type { Hasher } from '../../cryptography/hasher'
import type { AccessCodesRepository } from '../../repositories/access-codes-repository'
import type { AccountsRepository } from '../../repositories/accounts-repository'
import type { UsersRepository } from '../../repositories/users-repository'

const ACCESS_CODE_EXPIRES_IN_MINUTES = 15

const UNAVAILABLE_STATUSES = new Set([UserStatus.BLOCKED, UserStatus.DELETED, UserStatus.INACTIVE])

interface RequestAccessCodeUseCaseRequest {
  email: string
}

type RequestAccessCodeUseCaseResponse = Either<
  UserNotFoundError | AccountNotFoundError | UserUnavailableError,
  { accessCodeId: UniqueEntityId }
>

export class RequestAccessCodeUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly accessCodesRepository: AccessCodesRepository,
    private readonly hasher: Hasher,
    private readonly mail: Mail,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ email }: RequestAccessCodeUseCaseRequest): Promise<RequestAccessCodeUseCaseResponse> {
    const emailNormalized = email.toLocaleLowerCase()

    const userResult = await this.findUserOrFail(emailNormalized)

    if (userResult.isLeft()) {
      return left(userResult.value)
    }

    const user = userResult.value
    const actorId = user.id.toString()

    const validateResult = await this.validateUser(user, actorId)

    if (validateResult.isLeft()) {
      return left(validateResult.value)
    }

    const accountResult = await this.findAccountOrFail(user.id.toString(), actorId)

    if (accountResult.isLeft()) {
      return left(accountResult.value)
    }

    const account = accountResult.value

    await this.invalidateActiveCodes(account.id.toString())

    const accessCodeId = await this.createAndSendAccessCode(user, account, actorId)

    return right({ accessCodeId })
  }

  private generateAccessCode(size: number = 12): string {
    return customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', size).call(null)
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'identity.access-code',
      resourceId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  private async findUserOrFail(email: string): Promise<Either<UserNotFoundError, User>> {
    const user = await this.usersRepository.findByEmail(email)

    if (!user) {
      return left(new UserNotFoundError())
    }

    return right(user)
  }

  private async validateUser(user: User, actorId: string): Promise<Either<UserUnavailableError, null>> {
    if (UNAVAILABLE_STATUSES.has(user.status)) {
      await this.log({
        actorId,
        resourceId: actorId,
        text: `Usuário com status ${user.status}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserUnavailableError())
    }

    return right(null)
  }

  private async findAccountOrFail(userId: string, actorId: string): Promise<Either<AccountNotFoundError, Account>> {
    const account = await this.accountsRepository.findByUserId(userId)

    if (!account) {
      await this.log({
        actorId,
        resourceId: actorId,
        text: `Conta não encontrada para o usuário ${actorId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new AccountNotFoundError())
    }

    return right(account)
  }

  private async invalidateActiveCodes(accountId: string) {
    const activeCodes = await this.accessCodesRepository.findManyActiveByAccountId(accountId)

    for (const activeCode of activeCodes) {
      activeCode.consume()
      await this.accessCodesRepository.save(activeCode)
    }
  }

  private async createAndSendAccessCode(user: User, account: Account, actorId: string) {
    const plainCode = this.generateAccessCode()
    const codeHash = await this.hasher.hash(plainCode)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ACCESS_CODE_EXPIRES_IN_MINUTES * 60 * 1000)

    const accessCode = AccessCode.create({
      accountId: account.id,
      codeHash,
      expiresAt,
      createdAt: now,
    })

    await this.accessCodesRepository.create(accessCode)

    await this.mail.send(
      accessCodeMail({
        to: user.email,
        code: plainCode,
        expiresIn: ACCESS_CODE_EXPIRES_IN_MINUTES,
      }),
    )

    await this.log({
      actorId,
      resourceId: accessCode.id.toString(),
      text: `Código de acesso criado para a conta ${account.id.toString()}.`,
      status: AuditLogStatus.SUCCESS,
    })

    return accessCode.id
  }
}
