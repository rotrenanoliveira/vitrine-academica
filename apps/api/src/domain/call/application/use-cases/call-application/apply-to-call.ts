import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { Call } from '../../../enterprise/entities/call'
import { CallApplication } from '../../../enterprise/entities/call-application'
import { AlreadyAppliedToCallError } from '../../_errors/already-applied-to-call-error'
import { CallNotAcceptingApplicationsError } from '../../_errors/call-not-accepting-applications-error'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { CannotApplyToOwnCallError } from '../../_errors/cannot-apply-to-own-call-error'
import type { CallApplicationsRepository } from '../../repositories/call-applications-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

interface ApplyToCallUseCaseRequest {
  callId: string
  applicantId: string
  message?: string | null
  date?: Date
}

type ApplyToCallUseCaseResponse = Either<
  CallNotFoundError | CannotApplyToOwnCallError | CallNotAcceptingApplicationsError | AlreadyAppliedToCallError,
  { application: CallApplication }
>

export class ApplyToCallUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callApplicationsRepository: CallApplicationsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    callId,
    applicantId,
    message,
    date = new Date(),
  }: ApplyToCallUseCaseRequest): Promise<ApplyToCallUseCaseResponse> {
    const callResult = await this.findCallOpenForApplicant(callId, applicantId, date)

    if (callResult.isLeft()) {
      return left(callResult.value)
    }

    const duplicateCheck = await this.ensureNotAlreadyApplied(callId, applicantId)

    if (duplicateCheck.isLeft()) {
      return left(duplicateCheck.value)
    }

    const normalizedMessage = this.normalizeMessage(message)

    const application = CallApplication.create({
      callId: new UniqueEntityId(callId),
      applicantId: new UniqueEntityId(applicantId),
      message: normalizedMessage,
    })

    await this.callApplicationsRepository.create(application)

    await this.log({
      actorId: applicantId,
      resourceId: application.id.toString(),
      text: `Usuário ${applicantId} se candidatou ao chamado ${callId}.`,
      status: AuditLogStatus.SUCCESS,
      diff: {
        callId: { old: null, new: callId },
        message: { old: null, new: normalizedMessage },
      },
    })

    return right({ application })
  }

  private async log({ actorId, resourceId, sessionId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'call.application',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findCallOpenForApplicant(
    callId: string,
    applicantId: string,
    date: Date,
  ): Promise<Either<CallNotFoundError | CannotApplyToOwnCallError | CallNotAcceptingApplicationsError, Call>> {
    const call = await this.callsRepository.findById(callId)

    if (!call) {
      await this.log({
        actorId: applicantId,
        resourceId: callId,
        text: `Chamado ${callId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CallNotFoundError())
    }

    if (call.authorId.toString() === applicantId) {
      await this.log({
        actorId: applicantId,
        resourceId: callId,
        text: `Usuário ${applicantId} tentou se candidatar ao próprio chamado ${callId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CannotApplyToOwnCallError())
    }

    if (!call.isAcceptingApplications(date)) {
      await this.log({
        actorId: applicantId,
        resourceId: callId,
        text: `Chamado ${callId} não está recebendo candidaturas.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CallNotAcceptingApplicationsError())
    }

    return right(call)
  }

  private async ensureNotAlreadyApplied(
    callId: string,
    applicantId: string,
  ): Promise<Either<AlreadyAppliedToCallError, null>> {
    const existingApplication = await this.callApplicationsRepository.findByCallIdAndApplicantId(callId, applicantId)

    if (existingApplication) {
      await this.log({
        actorId: applicantId,
        resourceId: existingApplication.id.toString(),
        text: `Usuário ${applicantId} já se candidatou ao chamado ${callId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new AlreadyAppliedToCallError())
    }

    return right(null)
  }

  private normalizeMessage(message?: string | null): string | null {
    return message?.trim() ? message.trim() : null
  }
}
