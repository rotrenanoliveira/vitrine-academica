import { type Either, left, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import type { InstitutionsRepository } from '@/domain/institution/application/repositories/institutions-repository'
import { InstitutionMemberStatus } from '@/domain/institution/enterprise/entities/institution-member'
import type { CallApplicationStatus } from '../../../enterprise/entities/call-application'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import type { CallApplicantMembership, CallApplicationWithApplicant } from '../../dtos/call-application-with-applicant'
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
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly institutionsRepository: InstitutionsRepository,
  ) {}

  async execute({
    callId,
    authorId,
    status,
  }: FetchCallApplicationsUseCaseRequest): Promise<FetchCallApplicationsUseCaseResponse> {
    const call = await this.callsRepository.findById(callId)

    if (!call) {
      return left(new CallNotFoundError())
    }

    if (call.authorId.toString() !== authorId) {
      return left(new NotCallOwnerError())
    }

    const applications = await this.callApplicationsRepository.findManyByCallId(callId, status)

    if (applications.length === 0) {
      return right({ applications: [] })
    }

    const institutions = await this.institutionsRepository.findAll()
    const institutionNamesById = new Map(
      institutions.map((institution) => [institution.id.toString(), institution.name]),
    )

    const applicationsWithApplicant: CallApplicationWithApplicant[] = []

    for (const application of applications) {
      const applicantId = application.applicantId.toString()
      const user = await this.usersRepository.findById(applicantId)
      const members = await this.institutionMembersRepository.findManyByUserId(applicantId)

      const memberships: CallApplicantMembership[] = members
        .filter((member) => member.status === InstitutionMemberStatus.ACTIVE)
        .flatMap((member) => {
          const institutionName = institutionNamesById.get(member.institutionId)

          if (!institutionName) {
            return []
          }

          return [{ institutionId: member.institutionId, institutionName, role: member.role }]
        })

      applicationsWithApplicant.push({
        application,
        applicant: {
          id: applicantId,
          name: user?.name ?? REMOVED_USER_NAME,
          memberships,
        },
      })
    }

    return right({ applications: applicationsWithApplicant })
  }
}
