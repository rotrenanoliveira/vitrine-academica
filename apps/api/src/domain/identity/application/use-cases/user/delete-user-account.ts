import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { InstitutionsRepository } from '@/domain/institution/application/repositories/institutions-repository'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import {
  type Institution,
  InstitutionOrigin,
  InstitutionStatus,
} from '@/domain/institution/enterprise/entities/institutions'
import type { DeleteAttachmentUseCase } from '@/domain/storage/application/use-cases/delete-attachment'
import { SoleInstitutionManagerError } from '../../_errors/sole-institution-manager-error'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import type { AccountsRepository } from '../../repositories/accounts-repository'
import type { SessionsRepository } from '../../repositories/sessions-repository'
import type { UsersRepository } from '../../repositories/users-repository'

interface DeleteUserAccountUseCaseRequest {
  userId: string
}

type ArchivedInstitution = { id: string; name: string }

type DeleteUserAccountUseCaseResponse = Either<
  UserNotFoundError | SoleInstitutionManagerError,
  { archivedInstitutions: ArchivedInstitution[] }
>

const ANONYMOUS_NAME = 'Usuário removido'

const OPEN_MEMBER_STATUSES = [
  InstitutionMemberStatus.ACTIVE,
  InstitutionMemberStatus.PENDING,
  InstitutionMemberStatus.SUSPENDED,
]

type LogParams = {
  userId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

export class DeleteUserAccountUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly deleteAttachment: DeleteAttachmentUseCase,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ userId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId: userId,
      sessionId: null,
      action: AuditLogAction.DELETE,
      resource: 'identity.user',
      resourceId: userId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  async execute({ userId }: DeleteUserAccountUseCaseRequest): Promise<DeleteUserAccountUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user || user.status === UserStatus.DELETED) {
      return left(new UserNotFoundError())
    }

    const memberships = await this.institutionMembersRepository.findManyByUserId(userId)

    const managerships = memberships.filter((member) => {
      return member.role === InstitutionMemberRole.MANAGER && member.status === InstitutionMemberStatus.ACTIVE
    })

    const blocked: Institution[] = []
    const toArchive: Institution[] = []

    for (const managership of managerships) {
      const institution = await this.institutionsRepository.findById(managership.institutionId)

      if (!institution) {
        continue
      }

      const members = await this.institutionMembersRepository.findManyByInstitutionId(managership.institutionId)

      const others = members.filter((member) => {
        return member.userId !== userId && member.status === InstitutionMemberStatus.ACTIVE
      })

      const hasOtherManager = others.some((member) => member.role === InstitutionMemberRole.MANAGER)

      if (hasOtherManager) {
        continue
      }

      if (others.length > 0) {
        blocked.push(institution)
        continue
      }

      if (institution.origin !== InstitutionOrigin.SEED) {
        toArchive.push(institution)
      }
    }

    if (blocked.length > 0) {
      await this.log({
        userId,
        text: `Exclusão da conta ${userId} bloqueada: único gerente de ${blocked.length} instituição(ões).`,
        status: AuditLogStatus.FAILURE,
      })

      return left(
        new SoleInstitutionManagerError(
          blocked.map((institution) => ({ id: institution.id.toString(), name: institution.name })),
        ),
      )
    }

    for (const institution of toArchive) {
      institution.status = InstitutionStatus.ARCHIVED
      await this.institutionsRepository.save(institution)
    }

    for (const member of memberships) {
      if (OPEN_MEMBER_STATUSES.includes(member.status)) {
        member.status = InstitutionMemberStatus.INACTIVE
        await this.institutionMembersRepository.save(member)
      }
    }

    const sessions = await this.sessionsRepository.findManyByUserId(userId)

    for (const session of sessions) {
      if (!session.isRevoked()) {
        session.revoke()
        await this.sessionsRepository.save(session)
      }
    }

    const account = await this.accountsRepository.findByUserId(userId)

    if (account?.avatarId) {
      await this.deleteAttachment.execute({ attachmentId: account.avatarId.toString() })

      account.avatarId = null
      await this.accountsRepository.save(account)
    }

    const oldStatus = user.status

    user.name = ANONYMOUS_NAME
    user.email = `deleted-${userId}@anonymized.invalid`
    user.status = UserStatus.DELETED

    await this.usersRepository.save(user)

    await this.log({
      userId,
      text: `Conta do usuário ${userId} excluída (anonimizada) com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: oldStatus, new: user.status } },
    })

    return right({
      archivedInstitutions: toArchive.map((institution) => ({
        id: institution.id.toString(),
        name: institution.name,
      })),
    })
  }
}
