import type { FastifyReply } from 'fastify'
import { AccessCodeAlreadyConsumedError } from '@/domain/identity/application/_errors/access-code-already-consumed-error'
import { AccountNotFoundError } from '@/domain/identity/application/_errors/account-not-found-error'
import { ExpiredAccessCodeError } from '@/domain/identity/application/_errors/expired-access-code-error'
import { InvalidAccessCodeError } from '@/domain/identity/application/_errors/invalid-access-code-error'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import type { AuthenticateWithAccessCodeUseCase } from '@/domain/identity/application/use-cases/auth/authenticate-with-access-code'
import { UserPresenter } from '../../presenters/user-presenter'

interface AuthenticateWithAccessCodeBody {
  email: string
  code: string
}

export class AuthenticateWithAccessCodeController {
  constructor(private readonly authenticateWithAccessCode: AuthenticateWithAccessCodeUseCase) {}

  async handle({ email, code }: AuthenticateWithAccessCodeBody, reply: FastifyReply) {
    const result = await this.authenticateWithAccessCode.execute({ email, code })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof UserNotFoundError || error instanceof AccountNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof AccessCodeAlreadyConsumedError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      if (
        error instanceof UserUnavailableError ||
        error instanceof InvalidAccessCodeError ||
        error instanceof ExpiredAccessCodeError
      ) {
        return reply.status(400).send({
          message: error.message,
        })
      }

      throw error
    }

    const { user, account, session } = result.value

    const accessToken = await reply.jwtSign(
      {
        sub: user.id.toString(),
        jti: session.id.toString(),
      },
      {
        expiresIn: '7d',
      },
    )

    return reply.status(201).send({
      accessToken,
      user: UserPresenter.toHTTP(user, account.id),
    })
  }
}
