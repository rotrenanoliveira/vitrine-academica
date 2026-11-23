import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
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

type SystemLogParams = Omit<LogParams, 'actorId'>

type CallSnapshot = {
  status: Call['status']
  projectId: string | null
}

type CloseExpiredCallsUseCaseResponse = Either<never, { calls: Call[]; failures: CloseExpiredCallFailure[] }>

export class CloseExpiredCallsUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly createProjectFromCall: CreateProjectFromCallUseCase,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    date = new Date(),
  }: CloseExpiredCallsUseCaseRequest = {}): Promise<CloseExpiredCallsUseCaseResponse> {
    const expiredCalls = await this.callsRepository.findManyExpiredOpen(date)
    const closedCalls: Call[] = []
    const failures: CloseExpiredCallFailure[] = []

    for (const call of expiredCalls) {
      const callId = call.id.toString()
      const snapshot = this.takeSnapshot(call)

      const closeResult = await this.closeAndGenerateProject(call)

      if (closeResult.isLeft()) {
        failures.push({ callId, error: closeResult.value })
        await this.logFailure(callId)

        continue
      }

      closedCalls.push(call)

      await this.logClosed(call, snapshot)
    }

    return right({ calls: closedCalls, failures })
  }

  private async log({ resourceId, sessionId, text, status, diff }: SystemLogParams) {
    await this.registerLog.execute({
      actorId: SYSTEM_ACTOR_ID,
      sessionId: sessionId ?? null,
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

  private async logClosed(call: Call, previous: CallSnapshot) {
    const callId = call.id.toString()

    await this.log({
      resourceId: callId,
      text: `Chamado ${callId} encerrado automaticamente por prazo vencido.`,
      status: AuditLogStatus.SUCCESS,
      diff: {
        status: { old: previous.status, new: call.status },
        projectId: { old: previous.projectId, new: call.projectId?.toString() ?? null },
      },
    })
  }

  private takeSnapshot(call: Call): CallSnapshot {
    return {
      status: call.status,
      projectId: call.projectId?.toString() ?? null,
    }
  }

  private async closeAndGenerateProject(call: Call): Promise<Either<unknown, null>> {
    try {
      await this.createProjectFromCall.execute({ call, actorId: SYSTEM_ACTOR_ID })

      call.close()
      await this.callsRepository.save(call)

      return right(null)
    } catch (error) {
      return left(error)
    }
  }
}
