import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
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
    const sessionResult = await this.findSessionOrFail(sessionId)

    if (sessionResult.isLeft()) {
      return left(sessionResult.value)
    }

    const session = sessionResult.value
    const actorId = session.userId.toString()

    const revokedResult = await this.validateSession(session, actorId, sessionId)

    if (revokedResult.isLeft()) {
      return left(revokedResult.value)
    }

    await this.revokeSession(session, actorId, sessionId)

    return right({ session })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.LOGOUT,
      resource: 'identity.session',
      resourceId,
      diff: diff ?? null,
      text,
      status,
    })
  }

  private async findSessionOrFail(sessionId: string): Promise<Either<SessionNotFoundError, Session>> {
    const session = await this.sessionsRepository.findById(sessionId)

    if (!session) {
      return left(new SessionNotFoundError())
    }

    return right(session)
  }

  private async validateSession(
    session: Session,
    actorId: string,
    sessionId: string,
  ): Promise<Either<SessionAlreadyRevokedError, null>> {
    if (session.isRevoked()) {
      await this.log({
        actorId,
        sessionId,
        resourceId: sessionId,
        text: `Sessão do usuário ${actorId} já revogada.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new SessionAlreadyRevokedError())
    }

    return right(null)
  }

  private async revokeSession(session: Session, actorId: string, sessionId: string) {
    session.revoke()

    await this.sessionsRepository.save(session)

    await this.log({
      actorId,
      sessionId,
      resourceId: sessionId,
      text: `Sessão do usuário ${actorId} revogada.`,
      status: AuditLogStatus.SUCCESS,
    })
  }
}
