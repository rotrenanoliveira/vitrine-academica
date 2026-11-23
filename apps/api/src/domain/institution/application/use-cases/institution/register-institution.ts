import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { InstitutionMember, InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import { Institution, InstitutionOrigin, type InstitutionType } from '../../../enterprise/entities/institutions'
import { InstitutionAlreadyExistsError } from '../../_errors/institution-already-exists-error'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface RegisterInstitutionUseCaseRequest {
  name: string
  type: InstitutionType
  description: string
  registerBy: string
  shouldProof?: boolean
  shouldVerify?: boolean
  domain?: string
}

type CreateInstitutionWithManagerInput = {
  name: string
  type: InstitutionType
  description: string
  registerBy: string
  slug: Slug
  shouldProof: boolean
  shouldVerify: boolean
  domain?: string
}

type RegisterInstitutionUseCaseResponse = Either<
  InstitutionAlreadyExistsError,
  { institution: Institution; member: InstitutionMember }
>

export class RegisterInstitutionUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute(params: RegisterInstitutionUseCaseRequest): Promise<RegisterInstitutionUseCaseResponse> {
    const slug = Slug.createFromText(params.name)

    const slugAvailable = await this.isSlugAvailable(slug.value, params.registerBy)

    if (slugAvailable.isLeft()) {
      return left(slugAvailable.value)
    }

    const { institution, member } = await this.createInstitutionWithManager({
      name: params.name,
      type: params.type,
      description: params.description,
      registerBy: params.registerBy,
      shouldProof: params.shouldProof ?? false,
      shouldVerify: params.shouldVerify ?? false,
      domain: params.domain,
      slug,
    })

    await this.log({
      actorId: params.registerBy,
      resourceId: institution.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Instituição criada com sucesso.`,
      diff: null,
    })

    return right({ institution, member })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'institution',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async isSlugAvailable(
    slug: string,
    registerBy: string,
  ): Promise<Either<InstitutionAlreadyExistsError, true>> {
    const institutionWithSameSlug = await this.institutionsRepository.findBySlug(slug)

    if (institutionWithSameSlug) {
      await this.log({
        actorId: registerBy,
        resourceId: institutionWithSameSlug.id.toString(),
        status: AuditLogStatus.FAILURE,
        text: '',
      })

      return left(new InstitutionAlreadyExistsError())
    }

    return right(true)
  }

  private async createInstitutionWithManager(input: CreateInstitutionWithManagerInput) {
    const institution = Institution.create({
      name: input.name,
      slug: input.slug,
      type: input.type,
      description: input.description,
      registerBy: new UniqueEntityId(input.registerBy),
      origin: InstitutionOrigin.USER_REGISTRATION,
      shouldProof: input.shouldProof,
      shouldVerify: input.shouldVerify,
      domain: input.domain,
    })

    const member = InstitutionMember.create({
      institutionId: institution.id.toString(),
      userId: input.registerBy,
      role: InstitutionMemberRole.MANAGER,
    })

    await this.institutionsRepository.create(institution)

    await this.institutionMembersRepository.create(member)

    return { institution, member }
  }
}
