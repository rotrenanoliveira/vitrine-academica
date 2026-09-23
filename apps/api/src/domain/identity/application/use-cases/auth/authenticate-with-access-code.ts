import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { Account } from '../../../enterprise/entities/account'
import { Session } from '../../../enterprise/entities/session'
import { type User, UserStatus } from '../../../enterprise/entities/user'
import { AccessCodeAlreadyConsumedError } from '../../_errors/access-code-already-consumed-error'
import { AccountNotFoundError } from '../../_errors/account-not-found-error'
import { ExpiredAccessCodeError } from '../../_errors/expired-access-code-error'
import { InvalidAccessCodeError } from '../../_errors/invalid-access-code-error'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import { UserUnavailableError } from '../../_errors/user-unavailable-error'
import type { Hasher } from '../../cryptography/hasher'
import type { AccessCodesRepository } from '../../repositories/access-codes-repository'
import type { AccountsRepository } from '../../repositories/accounts-repository'
import type { SessionsRepository } from '../../repositories/sessions-repository'
import type { UsersRepository } from '../../repositories/users-repository'

const SESSION_EXPIRES_IN_DAYS = 7

const UNAVAILABLE_STATUSES = new Set([UserStatus.BLOCKED, UserStatus.DELETED, UserStatus.INACTIVE])

interface AuthenticateWithAccessCodeUseCaseRequest {
  email: string
  code: string
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
}

type AuthenticateWithAccessCodeUseCaseResponse = Either<
  | UserNotFoundError
  | AccountNotFoundError
  | UserUnavailableError
  | InvalidAccessCodeError
  | ExpiredAccessCodeError
  | AccessCodeAlreadyConsumedError,
  { user: User; account: Account; session: Session }
>

export class AuthenticateWithAccessCodeUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly accessCodesRepository: AccessCodesRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly hasher: Hasher,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.LOGIN,
      resource: 'identity.session',
      resourceId,
      diff: null,
      text,
      status,
    })
  }

  async execute({
    email,
    code,
  }: AuthenticateWithAccessCodeUseCaseRequest): Promise<AuthenticateWithAccessCodeUseCaseResponse> {
    const emailNormalized = email.toLocaleLowerCase()

    const user = await this.usersRepository.findByEmail(emailNormalized)

    if (!user) {
      return left(new UserNotFoundError())
    }

    const actorId = user.id.toString()

    if (UNAVAILABLE_STATUSES.has(user.status)) {
      await this.log({
        actorId,
        resourceId: actorId,
        text: `Usuário com status ${user.status}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserUnavailableError())
    }

    const account = await this.accountsRepository.findByUserId(user.id.toString())

    if (!account) {
      await this.log({
        actorId,
        resourceId: actorId,
        text: `Conta não encontrada para o usuário ${actorId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new AccountNotFoundError())
    }

    const accessCode = await this.accessCodesRepository.findActiveByAccountId(account.id.toString())

    if (!accessCode) {
      await this.log({
        actorId,
        resourceId: actorId,
        text: `Código de acesso inválido para a conta ${account.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidAccessCodeError())
    }

    const matches = await this.hasher.compare(code, accessCode.codeHash)

    if (!matches) {
      await this.log({
        actorId,
        resourceId: actorId,
        text: `Código de acesso inválido para a conta ${account.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidAccessCodeError())
    }

    if (accessCode.isConsumed()) {
      await this.log({
        actorId,
        resourceId: actorId,
        text: `Código de acesso já utilizado para a conta ${account.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new AccessCodeAlreadyConsumedError())
    }

    if (accessCode.isExpired()) {
      await this.log({
        actorId,
        resourceId: actorId,
        text: `Código de acesso expirado para a conta ${account.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ExpiredAccessCodeError())
    }

    accessCode.consume()
    await this.accessCodesRepository.save(accessCode)

    if (user.status === UserStatus.PENDING) {
      user.status = UserStatus.ACTIVE
      await this.usersRepository.save(user)
    }

    if (!account.confirmationAt) {
      account.confirmationAt = new Date()
      await this.accountsRepository.save(account)
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000)

    const session = Session.create({
      accountId: account.id,
      userId: user.id,
      expiresAt,
      createdAt: now,
    })

    await this.sessionsRepository.create(session)

    await this.log({
      actorId,
      resourceId: session.id.toString(),
      text: `Sessão criada para o usuário ${actorId}.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ user, account, session })
  }
}
