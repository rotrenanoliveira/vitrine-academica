import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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

  async execute({
    name,
    type,
    description,
    registerBy,
    shouldProof = false,
    shouldVerify = false,
    domain,
  }: RegisterInstitutionUseCaseRequest): Promise<RegisterInstitutionUseCaseResponse> {
    const slug = Slug.createFromText(name)

    const institutionWithSameSlug = await this.institutionsRepository.findBySlug(slug.value)

    if (institutionWithSameSlug) {
      await this.registerLog.execute({
        actorId: registerBy,
        sessionId: null,
        action: AuditLogAction.CREATE,
        resource: 'institution',
        resourceId: institutionWithSameSlug.id.toString(),
        diff: null,
        status: AuditLogStatus.FAILURE,
      })
      return left(new InstitutionAlreadyExistsError())
    }

    const institution = Institution.create({
      name,
      slug,
      type,
      description,
      registerBy: new UniqueEntityId(registerBy),
      origin: InstitutionOrigin.USER_REGISTRATION,
      shouldProof,
      shouldVerify,
      domain,
    })

    const member = InstitutionMember.create({
      institutionId: institution.id.toString(),
      userId: registerBy,
      role: InstitutionMemberRole.MANAGER,
    })

    await this.institutionsRepository.create(institution)
    await this.institutionMembersRepository.create(member)

    await this.registerLog.execute({
      actorId: registerBy,
      sessionId: null,
      action: AuditLogAction.CREATE,
      resource: 'institution',
      resourceId: institution.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Instituição criada com sucesso.`,
      diff: null,
    })

    return right({ institution, member })
  }
}
