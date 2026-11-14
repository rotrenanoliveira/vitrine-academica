import type { CallApplicationsRepository } from '@/domain/call/application/repositories/call-applications-repository'
import type { CallApplication, CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'

export class InMemoryCallApplicationsRepository implements CallApplicationsRepository {
  public items: CallApplication[] = []

  async findById(id: string): Promise<CallApplication | null> {
    return this.items.find((application) => application.id.toString() === id) ?? null
  }

  async findByCallIdAndApplicantId(callId: string, applicantId: string): Promise<CallApplication | null> {
    return (
      this.items.find(
        (application) => application.callId.toString() === callId && application.applicantId.toString() === applicantId,
      ) ?? null
    )
  }

  async findManyByCallId(callId: string, status?: CallApplicationStatus): Promise<CallApplication[]> {
    return this.items
      .filter((application) => {
        if (application.callId.toString() !== callId) return false
        if (status && application.status !== status) return false
        return true
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async findManyByApplicantId(applicantId: string): Promise<CallApplication[]> {
    return this.items
      .filter((application) => application.applicantId.toString() === applicantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async create(application: CallApplication): Promise<void> {
    this.items.push(application)
  }

  async save(application: CallApplication): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === application.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = application
  }
}
