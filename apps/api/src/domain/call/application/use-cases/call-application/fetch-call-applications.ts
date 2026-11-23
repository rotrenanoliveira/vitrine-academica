import { type Either, left, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { CallApplication, CallApplicationStatus } from '../../../enterprise/entities/call-application'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import type { CallApplicationWithApplicant } from '../../dtos/call-application-with-applicant'
import type { CallApplicationsRepository } from '../../repositories/call-applications-repository'
import type { CallsRepository } from '../../repositories/calls-repository'

const REMOVED_USER_NAME = 'Usuário removido'

interface FetchCallApplicationsUseCaseRequest {
  callId: string
  authorId: string
  status?: CallApplicationStatus
}

type FetchCallApplicationsUseCaseResponse = Either<
  CallNotFoundError | NotCallOwnerError,
  { applications: CallApplicationWithApplicant[] }
>

export class FetchCallApplicationsUseCase {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly callApplicationsRepository: CallApplicationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    callId,
    authorId,
    status,
  }: FetchCallApplicationsUseCaseRequest): Promise<FetchCallApplicationsUseCaseResponse> {
    const ownership = await this.ensureCallOwner(callId, authorId)

    if (ownership.isLeft()) {
      return left(ownership.value)
    }

    const applications = await this.callApplicationsRepository.findManyByCallId(callId, status)

    if (applications.length === 0) {
      return right({ applications: [] })
    }

    const applicationsWithApplicant = await this.attachApplicants(applications)

    return right({ applications: applicationsWithApplicant })
  }

  private async ensureCallOwner(
    callId: string,
    authorId: string,
  ): Promise<Either<CallNotFoundError | NotCallOwnerError, null>> {
    const call = await this.callsRepository.findById(callId)

    if (!call) {
      return left(new CallNotFoundError())
    }

    if (call.authorId.toString() !== authorId) {
      return left(new NotCallOwnerError())
    }

    return right(null)
  }

  private async attachApplicants(applications: CallApplication[]): Promise<CallApplicationWithApplicant[]> {
    const applicationsWithApplicant: CallApplicationWithApplicant[] = []

    for (const application of applications) {
      const applicantId = application.applicantId.toString()
      const user = await this.usersRepository.findById(applicantId)

      applicationsWithApplicant.push({
        application,
        applicantName: user?.name ?? REMOVED_USER_NAME,
      })
    }

    return applicationsWithApplicant
  }
}
