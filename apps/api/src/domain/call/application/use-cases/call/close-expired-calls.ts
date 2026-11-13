import { type Either, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { Call } from '../../../enterprise/entities/call'
import type { CallsRepository } from '../../repositories/calls-repository'
import type { CreateProjectFromCallUseCase } from './create-project-from-call'

const SYSTEM_ACTOR_ID = 'internal-system'

interface CloseExpiredCallsUseCaseRequest {
  date?: Date
}

interface CloseExpiredCallFailure {
  callId: string
  error: unknown
}

type LogParams = {
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type CloseExpiredCallsUseCaseResponse = Either<never, { calls: Call[]; failures: CloseExpiredCallFailure[] }>

export class CloseExpiredCallsUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly createProjectFromCall: CreateProjectFromCallUseCase,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId: SYSTEM_ACTOR_ID,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'call',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async logFailure(callId: string) {
    try {
      await this.log({
        resourceId: callId,
        text: `Falha ao encerrar o chamado ${callId} por prazo vencido.`,
        status: AuditLogStatus.FAILURE,
      })
    } catch {
      return
    }
  }

  async execute({
    date = new Date(),
  }: CloseExpiredCallsUseCaseRequest = {}): Promise<CloseExpiredCallsUseCaseResponse> {
    const expiredCalls = await this.callsRepository.findManyExpiredOpen(date)
    const closedCalls: Call[] = []
    const failures: CloseExpiredCallFailure[] = []

    for (const call of expiredCalls) {
      const callId = call.id.toString()
      const previousStatus = call.status
      const previousProjectId = call.projectId?.toString() ?? null

      try {
        await this.createProjectFromCall.execute({ call, actorId: SYSTEM_ACTOR_ID })

        call.close()
        await this.callsRepository.save(call)
      } catch (error) {
        failures.push({ callId, error })
        await this.logFailure(callId)

        continue
      }

      closedCalls.push(call)

      await this.log({
        resourceId: callId,
        text: `Chamado ${callId} encerrado automaticamente por prazo vencido.`,
        status: AuditLogStatus.SUCCESS,
        diff: {
          status: { old: previousStatus, new: call.status },
          projectId: { old: previousProjectId, new: call.projectId?.toString() ?? null },
        },
      })
    }

    return right({ calls: closedCalls, failures })
  }
}
