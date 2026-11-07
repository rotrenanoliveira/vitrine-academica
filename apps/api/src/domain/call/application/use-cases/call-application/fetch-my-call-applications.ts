import { type Either, right } from '@/core/either'
import type { CallApplicationWithCall } from '../../dtos/call-application-with-call'
import type { CallApplicationsRepository } from '../../repositories/call-applications-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

interface FetchMyCallApplicationsUseCaseRequest {
  applicantId: string
}

type FetchMyCallApplicationsUseCaseResponse = Either<never, { applications: CallApplicationWithCall[] }>

export class FetchMyCallApplicationsUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callApplicationsRepository: CallApplicationsRepository,
  ) {}

  async execute({
    applicantId,
  }: FetchMyCallApplicationsUseCaseRequest): Promise<FetchMyCallApplicationsUseCaseResponse> {
    const applications = await this.callApplicationsRepository.findManyByApplicantId(applicantId)

    if (applications.length === 0) {
      return right({ applications: [] })
    }

    const callIds = [...new Set(applications.map((application) => application.callId.toString()))]
    const calls = await this.callsRepository.findManyByIds(callIds)
    const callsById = new Map(calls.map((call) => [call.id.toString(), call]))

    const applicationsWithCall = applications.flatMap((application) => {
      const call = callsById.get(application.callId.toString())

      if (!call) {
        return []
      }

      return [{ application, call }]
    })

    return right({ applications: applicationsWithCall })
  }
}
