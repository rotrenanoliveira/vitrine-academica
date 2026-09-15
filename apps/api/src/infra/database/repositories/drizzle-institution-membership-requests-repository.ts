import { and, eq } from 'drizzle-orm'
import type { InstitutionMembershipRequestsRepository } from '@/domain/institution/application/repositories/institution-membership-requests-repository'
import type { InstitutionMembershipRequest } from '@/domain/institution/enterprise/entities/institution-membership-request'
import { InstitutionMembershipRequestStatus } from '@/domain/institution/enterprise/entities/institution-membership-request'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleInstitutionMembershipRequestMapper } from '../drizzle/mappers/drizzle-institution-membership-request-mapper'
import { institutionMembershipRequests } from '../drizzle/schemas'

export class DrizzleInstitutionMembershipRequestsRepository implements InstitutionMembershipRequestsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<InstitutionMembershipRequest | null> {
    const [row] = await this.db
      .select()
      .from(institutionMembershipRequests)
      .where(eq(institutionMembershipRequests.id, id))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleInstitutionMembershipRequestMapper.toDomain(row)
  }

  async findManyByInstitutionId(institutionId: string): Promise<InstitutionMembershipRequest[]> {
    const rows = await this.db
      .select()
      .from(institutionMembershipRequests)
      .where(eq(institutionMembershipRequests.institutionId, institutionId))

    return rows.map(DrizzleInstitutionMembershipRequestMapper.toDomain)
  }

  async findPendingByInstitutionAndUser(
    institutionId: string,
    userId: string,
  ): Promise<InstitutionMembershipRequest | null> {
    const [row] = await this.db
      .select()
      .from(institutionMembershipRequests)
      .where(
        and(
          eq(institutionMembershipRequests.institutionId, institutionId),
          eq(institutionMembershipRequests.userId, userId),
          eq(institutionMembershipRequests.status, InstitutionMembershipRequestStatus.PENDING),
        ),
      )
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleInstitutionMembershipRequestMapper.toDomain(row)
  }

  async create(request: InstitutionMembershipRequest): Promise<void> {
    await this.db
      .insert(institutionMembershipRequests)
      .values(DrizzleInstitutionMembershipRequestMapper.toPersistence(request))
  }

  async save(request: InstitutionMembershipRequest): Promise<void> {
    await this.db
      .update(institutionMembershipRequests)
      .set(DrizzleInstitutionMembershipRequestMapper.toPersistence(request))
      .where(eq(institutionMembershipRequests.id, request.id.toString()))
  }
}
