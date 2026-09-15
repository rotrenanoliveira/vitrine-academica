import { type Either, left, right } from '@/core/either'
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
  ) {}

  async execute({
    email,
    code,
  }: AuthenticateWithAccessCodeUseCaseRequest): Promise<AuthenticateWithAccessCodeUseCaseResponse> {
    const emailNormalized = email.toLocaleLowerCase()

    const user = await this.usersRepository.findByEmail(emailNormalized)

    if (!user) {
      return left(new UserNotFoundError())
    }

    if (UNAVAILABLE_STATUSES.has(user.status)) {
      return left(new UserUnavailableError())
    }

    const account = await this.accountsRepository.findByUserId(user.id.toString())

    if (!account) {
      return left(new AccountNotFoundError())
    }

    const accessCode = await this.accessCodesRepository.findActiveByAccountId(account.id.toString())

    if (!accessCode) {
      return left(new InvalidAccessCodeError())
    }

    const matches = await this.hasher.compare(code, accessCode.codeHash)

    if (!matches) {
      return left(new InvalidAccessCodeError())
    }

    if (accessCode.isConsumed()) {
      return left(new AccessCodeAlreadyConsumedError())
    }

    if (accessCode.isExpired()) {
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

    return right({ user, account, session })
  }
}
