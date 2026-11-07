import type { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import type { CallApplication } from '../../enterprise/entities/call-application'

export interface CallApplicantMembership {
  institutionId: string
  institutionName: string
  role: InstitutionMemberRole
}

export interface CallApplicantProfile {
  id: string
  name: string
  memberships: CallApplicantMembership[]
}

export interface CallApplicationWithApplicant {
  application: CallApplication
  applicant: CallApplicantProfile
}
