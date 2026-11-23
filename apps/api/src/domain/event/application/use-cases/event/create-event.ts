import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { canManageInstitution } from '@/domain/institution/application/authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { InstitutionsRepository } from '@/domain/institution/application/repositories/institutions-repository'
import type { Institution } from '@/domain/institution/enterprise/entities/institutions'
import { Event, type ParticipationScope } from '../../../enterprise/entities/event'
import { NotAllowedToManageEventError } from '../../_errors/not-allowed-to-manage-event-error'
import type { EventsRepository } from '../../repositories/events-repository'

interface CreateEventUseCaseRequest {
  institutionId: string
  actorId: string
  participationScope: ParticipationScope
  name?: string | null
  startsAt?: Date
}

type CreateEventInput = {
  institutionId: string
  institution: Institution
  participationScope: ParticipationScope
  name: string | null
  startsAt: Date
}

type CreateEventUseCaseResponse = Either<InstitutionNotFoundError | NotAllowedToManageEventError, { event: Event }>

export class CreateEventUseCase {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    participationScope,
    institutionId,
    actorId,
    name = null,
    startsAt = new Date(),
  }: CreateEventUseCaseRequest): Promise<CreateEventUseCaseResponse> {
    const institutionResult = await this.findInstitutionOrFail(institutionId, actorId)

    if (institutionResult.isLeft()) {
      return left(institutionResult.value)
    }

    const canManage = await this.canManageInstitution(institutionId, actorId)

    if (canManage.isLeft()) {
      return left(canManage.value)
    }

    const event = await this.createEvent(
      {
        institution: institutionResult.value,
        participationScope,
        institutionId,
        startsAt,
        name,
      },
      actorId,
    )

    return right({ event })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'event',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findInstitutionOrFail(
    institutionId: string,
    actorId: string,
  ): Promise<Either<InstitutionNotFoundError, Institution>> {
    const institution = await this.institutionsRepository.findById(institutionId)

    if (!institution) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: institutionId,
        text: `Instituição ${institutionId} não encontrada ao criar evento.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InstitutionNotFoundError())
    }

    return right(institution)
  }

  private async canManageInstitution(
    institutionId: string,
    actorId: string,
  ): Promise<Either<NotAllowedToManageEventError, boolean>> {
    const canManage = await canManageInstitution(this.institutionMembersRepository, institutionId, actorId)

    if (!canManage) {
      await this.log({
        actorId,
        sessionId: null,
        resourceId: institutionId,
        text: `Usuário ${actorId} sem permissão para criar evento na instituição ${institutionId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotAllowedToManageEventError())
    }

    return right(true)
  }

  private async resolveUniqueEventSlug(name: string | null, institution: Institution, startsAt: Date) {
    const datePart = startsAt.toISOString().slice(0, 10)
    const baseSlug = Slug.createFromText(name?.trim() ? name : `evento-${institution.slug.value}-${datePart}`).value

    let slug = baseSlug
    let suffix = 2
    while (await this.eventsRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    return slug
  }

  private async createEvent(params: CreateEventInput, actorId: string) {
    const slug = await this.resolveUniqueEventSlug(params.name, params.institution, params.startsAt)

    const event = Event.create({
      institutionId: new UniqueEntityId(params.institutionId),
      slug,
      name: params.name ?? null,
      participationScope: params.participationScope,
      startsAt: params.startsAt,
    })

    await this.eventsRepository.create(event)

    await this.log({
      actorId,
      sessionId: null,
      resourceId: event.id.toString(),
      status: AuditLogStatus.SUCCESS,
      text: `Evento ${event.id.toString()} criado com sucesso.`,
    })

    return event
  }
}
