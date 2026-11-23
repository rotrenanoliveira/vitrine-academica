import { type Either, right } from '@/core/either'
import type { Call } from '../../../enterprise/entities/call'
import type { CallWithSkills } from '../../dtos/call-with-skills'
import type { CallSkillsRepository } from '../../repositories/call-skills-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

interface FetchMyCallsUseCaseRequest {
  authorId: string
}

type FetchMyCallsUseCaseResponse = Either<never, { calls: CallWithSkills[] }>

export class FetchMyCallsUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callSkillsRepository: CallSkillsRepository,
  ) {}

  async execute({ authorId }: FetchMyCallsUseCaseRequest): Promise<FetchMyCallsUseCaseResponse> {
    const calls = await this.callsRepository.findManyByAuthorId(authorId)
    const callsWithSkills = await this.attachSkills(calls)

    return right({ calls: callsWithSkills })
  }

  private async attachSkills(calls: Call[]): Promise<CallWithSkills[]> {
    const skills = await this.callSkillsRepository.findManyByCallIds(calls.map((call) => call.id.toString()))

    return calls.map((call) => ({
      call,
      skills: skills.filter((skill) => skill.callId.toString() === call.id.toString()),
    }))
  }
}
