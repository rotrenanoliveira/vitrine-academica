import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { Call } from '../../../enterprise/entities/call'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { InvalidCallStatusError } from '../../_errors/invalid-call-status-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import type { CallsRepository } from '../../repositories/calls-repository'

interface CloseCallUseCaseRequest {
  callId: string
  authorId: string
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type CloseCallUseCaseResponse = Either<CallNotFoundError | NotCallOwnerError | InvalidCallStatusError, { call: Call }>

export class CloseCallUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'call',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({ callId, authorId }: CloseCallUseCaseRequest): Promise<CloseCallUseCaseResponse> {
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
        resourceId: callId,
        text: `Usuário ${authorId} não tem permissão para encerrar o chamado ${callId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotCallOwnerError())
    }

    if (!call.isOpen()) {
      await this.log({
        actorId: authorId,
        resourceId: callId,
        text: `Chamado ${callId} já está encerrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidCallStatusError('O chamado já está encerrado'))
    }

    const previousStatus = call.status

    call.close()
    await this.callsRepository.save(call)

    await this.log({
      actorId: authorId,
      resourceId: callId,
      text: `Chamado ${callId} encerrado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: previousStatus, new: call.status } },
    })

    return right({ call })
  }
}
