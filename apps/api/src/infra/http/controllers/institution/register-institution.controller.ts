import type { FastifyReply } from 'fastify'
import { InstitutionAlreadyExistsError } from '@/domain/institution/application/_errors/institution-already-exists-error'
import type { RegisterInstitutionUseCase } from '@/domain/institution/application/use-cases/institution/register-institution'
import type { InstitutionType } from '@/domain/institution/enterprise/entities/institutions'
import { InstitutionMemberPresenter } from '../../presenters/institution-member-presenter'
import { InstitutionPresenter } from '../../presenters/institution-presenter'

interface RegisterInstitutionBody {
  name: string
  type: InstitutionType
  description: string
  registerBy: string
  shouldProof?: boolean
  shouldVerify?: boolean
  domain?: string
}

export class RegisterInstitutionController {
  constructor(private readonly registerInstitution: RegisterInstitutionUseCase) {}

  async handle(
    { name, type, description, registerBy, shouldProof, shouldVerify, domain }: RegisterInstitutionBody,
    reply: FastifyReply,
  ) {
    const result = await this.registerInstitution.execute({
      name,
      type,
      description,
      registerBy,
      shouldProof,
      shouldVerify,
      domain,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionAlreadyExistsError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      institution: InstitutionPresenter.toHTTP(result.value.institution),
      member: InstitutionMemberPresenter.toHTTP(result.value.member),
    })
  }
}
