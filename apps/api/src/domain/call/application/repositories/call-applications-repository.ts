import type { CallApplication, CallApplicationStatus } from '../../enterprise/entities/call-application'

export interface CallApplicationsRepository {
  findById(id: string): Promise<CallApplication | null>
  findByCallIdAndApplicantId(callId: string, applicantId: string): Promise<CallApplication | null>
  findManyByCallId(callId: string, status?: CallApplicationStatus): Promise<CallApplication[]>
  findManyByApplicantId(applicantId: string): Promise<CallApplication[]>

  create(application: CallApplication): Promise<void>
  save(application: CallApplication): Promise<void>
}
