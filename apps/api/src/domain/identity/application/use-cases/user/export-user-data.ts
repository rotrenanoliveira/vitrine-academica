import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { Account } from '@/domain/identity/enterprise/entities/account'
import type { Session } from '@/domain/identity/enterprise/entities/session'
import type { User } from '@/domain/identity/enterprise/entities/user'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { InstitutionMember } from '@/domain/institution/enterprise/entities/institution-member'
import type { PointTransactionsRepository } from '@/domain/points/application/repositories/point-transactions-repository'
import type { PointTransaction } from '@/domain/points/enterprise/entities/point-transaction'
import type { PreferenceTagsRepository } from '@/domain/tag/application/repositories/preference-tags-repository'
import type { PreferenceTag } from '@/domain/tag/enterprise/entities/preference-tag'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import type { AccountsRepository } from '../../repositories/accounts-repository'
import type { SessionsRepository } from '../../repositories/sessions-repository'
import type { UserDataExportRepository, UserExportedRecords } from '../../repositories/user-data-export-repository'
import type { UsersRepository } from '../../repositories/users-repository'

interface ExportUserDataUseCaseRequest {
  userId: string
}

export interface UserDataReport extends UserExportedRecords {
  user: {
    id: string
    name: string
    email: string
    status: string
  }
  account: {
    id: string
    avatarId: string | null
    createdAt: Date
    confirmationAt: Date | null
    consentedAt: Date | null
    updatedAt: Date | null
  } | null
  sessions: Array<{
    id: string
    expiresAt: Date
    revokedAt: Date | null
  }>
  institutions: Array<{
    institutionId: string
    role: string
    status: string
  }>
  preferences: Array<{
    tagId: string
  }>
  points: {
    balance: number
    transactions: Array<{
      id: string
      type: string
      amount: number
      reason: string
      referenceId: string
      createdAt: Date
    }>
  }
}

type ExportUserDataUseCaseResponse = Either<UserNotFoundError, { userData: UserDataReport }>

type ExportSources = {
  account: Account | null
  sessions: Session[]
  memberships: InstitutionMember[]
  preferences: PreferenceTag[]
  pointsBalance: number
  pointTransactions: PointTransaction[]
  records: UserExportedRecords
}

export class ExportUserDataUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly preferenceTagsRepository: PreferenceTagsRepository,
    private readonly pointTransactionsRepository: PointTransactionsRepository,
    private readonly userDataExportRepository: UserDataExportRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ userId }: ExportUserDataUseCaseRequest): Promise<ExportUserDataUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new UserNotFoundError())
    }

    const sources = await this.fetchUserData(userId)
    const userData = this.buildUserDataReport(user, sources)

    await this.log({
      actorId: userId,
      resourceId: userId,
      text: `Dados do usuário ${userId} exportados.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ userData })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.EXPORT,
      resource: 'identity.user',
      resourceId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  private async fetchUserData(userId: string): Promise<ExportSources> {
    const [account, sessions, memberships, preferences, pointsBalance, pointTransactions, records] = await Promise.all([
      this.accountsRepository.findByUserId(userId),
      this.sessionsRepository.findManyByUserId(userId),
      this.institutionMembersRepository.findManyByUserId(userId),
      this.preferenceTagsRepository.findByUserId(userId),
      this.pointTransactionsRepository.getBalanceByUserId(userId),
      this.pointTransactionsRepository.findAllByUserId(userId),
      this.userDataExportRepository.findRecordsByUserId(userId),
    ])

    return {
      account,
      sessions,
      memberships,
      preferences,
      pointsBalance,
      pointTransactions,
      records,
    }
  }

  private buildUserDataReport(user: User, sources: ExportSources): UserDataReport {
    const { account, sessions, memberships, preferences, pointsBalance, pointTransactions, records } = sources

    return {
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        status: user.status,
      },
      account: account
        ? {
            id: account.id.toString(),
            avatarId: account.avatarId ? account.avatarId.toString() : null,
            createdAt: account.createdAt,
            confirmationAt: account.confirmationAt ?? null,
            consentedAt: account.consentedAt ?? null,
            updatedAt: account.updatedAt ?? null,
          }
        : null,
      sessions: sessions.map((session) => ({
        id: session.id.toString(),
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt ?? null,
      })),
      institutions: memberships.map((membership) => ({
        institutionId: membership.institutionId.toString(),
        role: membership.role,
        status: membership.status,
      })),
      preferences: preferences.map((preference) => ({
        tagId: preference.tagId.toString(),
      })),
      points: {
        balance: pointsBalance,
        transactions: pointTransactions.map((transaction) => ({
          id: transaction.id.toString(),
          type: transaction.type,
          amount: transaction.amount,
          reason: transaction.reason,
          referenceId: transaction.referenceId.toString(),
          createdAt: transaction.createdAt,
        })),
      },
      ...records,
    }
  }
}
