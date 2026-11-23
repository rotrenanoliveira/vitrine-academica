import { type Either, left, right } from '@/core/either'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import type { Call } from '../../../enterprise/entities/call'
import type { CallWithSkills } from '../../dtos/call-with-skills'
import type { CallSkillsRepository } from '../../repositories/call-skills-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

interface FetchCallsUseCaseRequest {
  tagIds?: string[]
  date?: Date
}

type FetchCallsUseCaseResponse = Either<TagNotFoundError, { calls: CallWithSkills[] }>

export class FetchCallsUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callSkillsRepository: CallSkillsRepository,
    private readonly tagsRepository: TagsRepository,
  ) {}

  async execute({ tagIds, date = new Date() }: FetchCallsUseCaseRequest = {}): Promise<FetchCallsUseCaseResponse> {
    const callsResult = await this.findCalls(tagIds, date)

    if (callsResult.isLeft()) {
      return left(callsResult.value)
    }

    const callsWithSkills = await this.attachSkills(callsResult.value)

    return right({ calls: callsWithSkills })
  }

  private async findCalls(tagIds: string[] | undefined, date: Date): Promise<Either<TagNotFoundError, Call[]>> {
    if (tagIds && tagIds.length > 0) {
      return this.findCallsByTags(tagIds, date)
    }

    return right(await this.callsRepository.findManyOpen(date))
  }

  private async findCallsByTags(tagIds: string[], date: Date): Promise<Either<TagNotFoundError, Call[]>> {
    const uniqueTagIds = [...new Set(tagIds)]
    const tags = await this.tagsRepository.findManyByIds(uniqueTagIds)

    if (tags.length !== uniqueTagIds.length) {
      return left(new TagNotFoundError())
    }

    const taggedSkills = await this.callSkillsRepository.findManyByTagIds(uniqueTagIds)
    const callIds = [...new Set(taggedSkills.map((skill) => skill.callId.toString()))]
    const taggedCalls = await this.callsRepository.findManyByIds(callIds)

    return right(taggedCalls.filter((call) => call.isAcceptingApplications(date)))
  }

  private async attachSkills(calls: Call[]): Promise<CallWithSkills[]> {
    const skills = await this.callSkillsRepository.findManyByCallIds(calls.map((call) => call.id.toString()))

    return calls.map((call) => ({
      call,
      skills: skills.filter((skill) => skill.callId.toString() === call.id.toString()),
    }))
  }
}
