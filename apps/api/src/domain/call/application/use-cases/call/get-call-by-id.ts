import { type Either, left, right } from '@/core/either'
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
    const call = await this.callsRepository.findById(callId)

    if (!call) {
      return left(new CallNotFoundError())
    }

    const skills = await this.callSkillsRepository.findManyByCallId(callId)

    return right({ call, skills })
  }
}
