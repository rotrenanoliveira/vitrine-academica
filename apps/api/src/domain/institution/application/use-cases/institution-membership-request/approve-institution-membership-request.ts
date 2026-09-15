import { type Either, left, right } from '@/core/either'
import { InstitutionMember, InstitutionMemberRole } from '../../../enterprise/entities/institution-member'
import {
  type InstitutionMembershipRequest,
  InstitutionMembershipRequestRole,
  InstitutionMembershipRequestStatus,
} from '../../../enterprise/entities/institution-membership-request'
import { InstitutionMemberAlreadyExistsError } from '../../_errors/institution-member-already-exists-error'
import { InstitutionMembershipRequestNotFoundError } from '../../_errors/institution-membership-request-not-found-error'
import { NotAllowedToManageInstitutionError } from '../../_errors/not-allowed-to-manage-institution-error'
import { canManageInstitution } from '../../authorization/can-manage-institution'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionMembershipRequestsRepository } from '../../repositories/institution-membership-requests-repository'

interface ApproveInstitutionMembershipRequestUseCaseRequest {
  requestId: string
  actorId: string
}

type ApproveInstitutionMembershipRequestUseCaseResponse = Either<
  InstitutionMembershipRequestNotFoundError | NotAllowedToManageInstitutionError | InstitutionMemberAlreadyExistsError,
  { request: InstitutionMembershipRequest; member: InstitutionMember }
>

function mapRequestRoleToMemberRole(role: InstitutionMembershipRequestRole): InstitutionMemberRole {
  switch (role) {
    case InstitutionMembershipRequestRole.STUDENT:
      return InstitutionMemberRole.STUDENT
    case InstitutionMembershipRequestRole.PROFESSOR:
      return InstitutionMemberRole.PROFESSOR
    case InstitutionMembershipRequestRole.TEACHER:
      return InstitutionMemberRole.TEACHER
    case InstitutionMembershipRequestRole.MANAGER:
      return InstitutionMemberRole.MANAGER
    case InstitutionMembershipRequestRole.ADMINISTRATIVE_OFFICE:
      return InstitutionMemberRole.ADMINISTRATIVE_OFFICE
  }
}

export class ApproveInstitutionMembershipRequestUseCase {
  constructor(
    private readonly institutionMembershipRequestsRepository: InstitutionMembershipRequestsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {}

  async execute({
    requestId,
    actorId,
  }: ApproveInstitutionMembershipRequestUseCaseRequest): Promise<ApproveInstitutionMembershipRequestUseCaseResponse> {
    const request = await this.institutionMembershipRequestsRepository.findById(requestId)

    if (!request) {
      return left(new InstitutionMembershipRequestNotFoundError())
    }

    const isAllowedToManage = await canManageInstitution(
      this.institutionMembersRepository,
      request.institutionId,
      actorId,
    )

    if (!isAllowedToManage) {
      return left(new NotAllowedToManageInstitutionError())
    }

    const existingMember = await this.institutionMembersRepository.findByInstitutionAndUser(
      request.institutionId,
      request.userId,
    )

    if (existingMember && existingMember.role === mapRequestRoleToMemberRole(request.role)) {
      return left(new InstitutionMemberAlreadyExistsError())
    }

    request.status = InstitutionMembershipRequestStatus.APPROVED

    const member = InstitutionMember.create({
      institutionId: request.institutionId,
      userId: request.userId,
      role: mapRequestRoleToMemberRole(request.role),
    })

    await this.institutionMembershipRequestsRepository.save(request)
    await this.institutionMembersRepository.create(member)

    return right({ request, member })
  }
}
