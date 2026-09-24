import { type Either, left, right } from '@/core/either'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { PreferenceTagsRepository } from '@/domain/tag/application/repositories/preference-tags-repository'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import type { AccountsRepository } from '../../repositories/accounts-repository'
import type { SessionsRepository } from '../../repositories/sessions-repository'
import type { UsersRepository } from '../../repositories/users-repository'

interface ExportUserDataUseCaseRequest {
  userId: string
}

export interface UserDataReport {
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
  projects: Array<{
    id: string
    title: string
    status: string
  }>
}

type ExportUserDataUseCaseResponse = Either<UserNotFoundError, { userData: UserDataReport }>

export class ExportUserDataUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly preferenceTagsRepository: PreferenceTagsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async execute({ userId }: ExportUserDataUseCaseRequest): Promise<ExportUserDataUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new UserNotFoundError())
    }

    const [account, sessions, memberships, preferences, projects] = await Promise.all([
      this.accountsRepository.findByUserId(userId),
      this.sessionsRepository.findManyByUserId(userId),
      this.institutionMembersRepository.findManyByUserId(userId),
      this.preferenceTagsRepository.findByUserId(userId),
      this.projectsRepository.findManyByAuthorId(userId),
    ])

    const userData: UserDataReport = {
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
      projects: projects.map((project) => ({
        id: project.id.toString(),
        title: project.title,
        status: project.status,
      })),
    }

    return right({ userData })
  }
}
