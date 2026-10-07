import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { Session } from '../../../enterprise/entities/session'
import { SessionAlreadyRevokedError } from '../../_errors/session-already-revoked-error'
import { SessionNotFoundError } from '../../_errors/session-not-found-error'
import type { SessionsRepository } from '../../repositories/sessions-repository'

interface LogoutUseCaseRequest {
  sessionId: string
}

type LogoutUseCaseResponse = Either<SessionNotFoundError | SessionAlreadyRevokedError, { session: Session }>

export class LogoutUseCase {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ sessionId }: LogoutUseCaseRequest): Promise<LogoutUseCaseResponse> {
    const session = await this.sessionsRepository.findById(sessionId)

    if (!session) {
      return left(new SessionNotFoundError())
    }

    const actorId = session.userId.toString()

    if (session.isRevoked()) {
      await this.registerLog.execute({
        actorId,
        sessionId,
        action: AuditLogAction.LOGOUT,
        resource: 'identity.session',
        resourceId: sessionId,
        diff: null,
        text: `Sessão do usuário ${actorId} já revogada.`,
        status: AuditLogStatus.FAILURE,
      })
      return left(new SessionAlreadyRevokedError())
    }

    session.revoke()
    await this.sessionsRepository.save(session)

    await this.registerLog.execute({
      actorId,
      sessionId,
      action: AuditLogAction.LOGOUT,
      resource: 'identity.session',
      resourceId: sessionId,
      diff: null,
      text: `Sessão do usuário ${actorId} revogada.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ session })
  }
}
