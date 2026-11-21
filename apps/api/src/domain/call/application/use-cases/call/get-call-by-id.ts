import { type Either, left, right } from '@/core/either'
import type { Call } from '../../../enterprise/entities/call'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import type { CallWithSkills } from '../../dtos/call-with-skills'
import type { CallSkillsRepository } from '../../repositories/call-skills-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

interface GetCallByIdUseCaseRequest {
  callId: string
}

type GetCallByIdUseCaseResponse = Either<CallNotFoundError, CallWithSkills>

export class GetCallByIdUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callSkillsRepository: CallSkillsRepository,
  ) {}

  async execute({ callId }: GetCallByIdUseCaseRequest): Promise<GetCallByIdUseCaseResponse> {
    const callResult = await this.findCall(callId)

    if (callResult.isLeft()) {
      return left(callResult.value)
    }

    const skills = await this.callSkillsRepository.findManyByCallId(callId)

    return right({ call: callResult.value, skills })
  }

  private async findCall(callId: string): Promise<Either<CallNotFoundError, Call>> {
    const call = await this.callsRepository.findById(callId)

    if (!call) {
      return left(new CallNotFoundError())
    }

    return right(call)
  }
}
