import type { FastifyReply } from 'fastify'
import type { RegisterUserUseCase } from '@/domain/application/use-cases/user/register-user'
import { UserPresenter } from '../../presenters/user-presenter'

interface RegisterUserBody {
  name: string
  email: string
}

export class RegisterUserController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  async handle({ name, email }: RegisterUserBody, reply: FastifyReply) {
    const result = await this.registerUser.execute({ name, email })

    if (result.isLeft()) {
      return reply.status(409).send({
        message: result.value.message,
      })
    }

    return reply.status(201).send({
      user: UserPresenter.toHTTP(result.value.user),
    })
  }
}
