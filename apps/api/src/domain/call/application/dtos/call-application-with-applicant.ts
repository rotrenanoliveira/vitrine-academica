import type { CallApplication } from '../../enterprise/entities/call-application'

export interface CallApplicationWithApplicant {
  application: CallApplication
  applicantName: string
}
