import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { Mail } from '@/domain/mail/application/mail/mail'
import { callApplicationDecisionMail } from '@/domain/mail/application/mail/messages/call-application-decision-mail'
import type { Call } from '../../../enterprise/entities/call'
import {
  type CallApplication,
  type CallApplicationDecision,
  CallApplicationStatus,
} from '../../../enterprise/entities/call-application'
import { CallApplicationNotFoundError } from '../../_errors/call-application-not-found-error'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { InvalidCallApplicationStatusError } from '../../_errors/invalid-call-application-status-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import type { CallApplicationsRepository } from '../../repositories/call-applications-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

interface DecideCallApplicationUseCaseRequest {
  callId: string
  applicationId: string
  authorId: string
  decision: CallApplicationDecision
  date?: Date
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type DecideCallApplicationUseCaseResponse = Either<
  CallNotFoundError | NotCallOwnerError | CallApplicationNotFoundError | InvalidCallApplicationStatusError,
  { application: CallApplication; notified: boolean }
>

export class DecideCallApplicationUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callApplicationsRepository: CallApplicationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly mail: Mail,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'call.application',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async notifyApplicant(
    authorId: string,
    application: CallApplication,
    call: Call,
    decision: CallApplicationDecision,
  ): Promise<boolean> {
    const applicant = await this.usersRepository.findById(application.applicantId.toString())

    if (!applicant || applicant.status === UserStatus.DELETED) {
      return false
    }

    try {
      await this.mail.send(
        callApplicationDecisionMail({
          to: applicant.email,
          name: applicant.name,
          callTitle: call.title,
          approved: decision === CallApplicationStatus.APPROVED,
        }),
      )

      return true
    } catch {
      await this.log({
        actorId: authorId,
        resourceId: application.id.toString(),
        text: `Falha ao enviar o e-mail da decisão da candidatura ${application.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return false
    }
  }

  async execute({
    callId,
    applicationId,
    authorId,
    decision,
    date = new Date(),
  }: DecideCallApplicationUseCaseRequest): Promise<DecideCallApplicationUseCaseResponse> {
    const call = await this.callsRepository.findById(callId)

    if (!call) {
      await this.log({
        actorId: authorId,
        resourceId: callId,
        text: `Chamado ${callId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CallNotFoundError())
    }

    if (call.authorId.toString() !== authorId) {
      await this.log({
        actorId: authorId,
        resourceId: applicationId,
        text: `Usuário ${authorId} não tem permissão para decidir candidaturas do chamado ${callId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotCallOwnerError())
    }

    const application = await this.callApplicationsRepository.findById(applicationId)

    if (!application || application.callId.toString() !== callId) {
      await this.log({
        actorId: authorId,
        resourceId: applicationId,
        text: `Candidatura ${applicationId} não encontrada no chamado ${callId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CallApplicationNotFoundError())
    }

    if (!application.isPending()) {
      await this.log({
        actorId: authorId,
        resourceId: applicationId,
        text: `Candidatura ${applicationId} já foi decidida (${application.status}).`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidCallApplicationStatusError('A candidatura já foi decidida'))
    }

    const previousStatus = application.status

    if (decision === CallApplicationStatus.APPROVED) {
      application.approve(date)
    } else {
      application.reject(date)
    }

    await this.callApplicationsRepository.save(application)

    await this.log({
      actorId: authorId,
      resourceId: applicationId,
      text: `Candidatura ${applicationId} atualizada para ${application.status}.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: previousStatus, new: application.status } },
    })

    const notified = await this.notifyApplicant(authorId, application, call, decision)

    return right({ application, notified })
  }
}
