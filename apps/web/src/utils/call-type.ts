import type { InstitutionMemberRole } from './type'

export type CallStatus = 'OPEN' | 'CLOSED'
export type CallApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type CallDecision = 'APPROVED' | 'REJECTED'

export type CallSkill = {
  id: string
  tagId: string
  description: string | null
}

export type CallSkillInput = {
  tagId: string
  description: string | null
}

export type Call = {
  id: string
  authorId: string
  title: string
  description: string
  applicationDeadline: string
  status: CallStatus
  createdAt: string
  updatedAt: string | null
}

export type CallWithSkills = Call & {
  skills: CallSkill[]
}

export type CallApplication = {
  id: string
  callId: string
  applicantId: string
  message: string | null
  status: CallApplicationStatus
  decidedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export type CallApplicant = {
  id: string
  name: string
  memberships: {
    institutionId: string
    institutionName: string
    role: InstitutionMemberRole
  }[]
}

export type CallApplicationWithApplicant = CallApplication & {
  applicant: CallApplicant
}

export type CallSummary = Pick<Call, 'id' | 'title' | 'status' | 'applicationDeadline'>

export type CallApplicationWithCall = CallApplication & {
  call: CallSummary
}
