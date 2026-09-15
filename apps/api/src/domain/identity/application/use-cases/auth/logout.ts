import { type Either, left, right } from '@/core/either'
import type { Session } from '../../../enterprise/entities/session'
import { SessionAlreadyRevokedError } from '../../_errors/session-already-revoked-error'
import { SessionNotFoundError } from '../../_errors/session-not-found-error'
import type { SessionsRepository } from '../../repositories/sessions-repository'

interface LogoutUseCaseRequest {
  sessionId: string
}

type LogoutUseCaseResponse = Either<SessionNotFoundError | SessionAlreadyRevokedError, { session: Session }>

export class LogoutUseCase {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute({ sessionId }: LogoutUseCaseRequest): Promise<LogoutUseCaseResponse> {
    const session = await this.sessionsRepository.findById(sessionId)

    if (!session) {
      return left(new SessionNotFoundError())
    }

    if (session.isRevoked()) {
      return left(new SessionAlreadyRevokedError())
    }

    session.revoke()
    await this.sessionsRepository.save(session)

    return right({ session })
  }
}
