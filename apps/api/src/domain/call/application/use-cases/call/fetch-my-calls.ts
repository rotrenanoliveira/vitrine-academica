import { type Either, right } from '@/core/either'
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
    const skills = await this.callSkillsRepository.findManyByCallIds(calls.map((call) => call.id.toString()))

    const callsWithSkills = calls.map((call) => ({
      call,
      skills: skills.filter((skill) => skill.callId.toString() === call.id.toString()),
    }))

    return right({ calls: callsWithSkills })
  }
}
