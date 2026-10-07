import type { InstitutionMembershipRequestsRepository } from '@/domain/institution/application/repositories/institution-membership-requests-repository'
import {
  type InstitutionMembershipRequest,
  InstitutionMembershipRequestStatus,
} from '@/domain/institution/enterprise/entities/institution-membership-request'

export class InMemoryInstitutionMembershipRequestsRepository implements InstitutionMembershipRequestsRepository {
  public items: InstitutionMembershipRequest[] = []

  async findById(id: string): Promise<InstitutionMembershipRequest | null> {
    return this.items.find((request) => request.id.toString() === id) ?? null
  }

  async findManyByInstitutionId(institutionId: string): Promise<InstitutionMembershipRequest[]> {
    return this.items.filter((request) => request.institutionId === institutionId)
  }

  async findPendingByInstitutionAndUser(
    institutionId: string,
    userId: string,
  ): Promise<InstitutionMembershipRequest | null> {
    return (
      this.items.find(
        (request) =>
          request.institutionId === institutionId &&
          request.userId === userId &&
          request.status === InstitutionMembershipRequestStatus.PENDING,
      ) ?? null
    )
  }

  async create(request: InstitutionMembershipRequest): Promise<void> {
    this.items.push(request)
  }

  async save(request: InstitutionMembershipRequest): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === request.id.toString())
    if (index === -1) return
    this.items[index] = request
  }
}
