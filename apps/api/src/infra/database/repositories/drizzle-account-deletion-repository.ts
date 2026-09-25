import { and, eq, inArray, ne } from 'drizzle-orm'
import type {
  AccountDeletionRepository,
  AnonymizeUserParams,
  ManagedInstitution,
} from '@/domain/identity/application/repositories/account-deletion-repository'
import { db } from '../drizzle/client'
import { institutionMembers } from '../drizzle/schemas/institution-members'
import { institutions } from '../drizzle/schemas/institutions'
import { users } from '../drizzle/schemas/users'

export class DrizzleAccountDeletionRepository implements AccountDeletionRepository {
  async findManagedInstitutions(userId: string): Promise<ManagedInstitution[]> {
    const managed = await db
      .select({
        id: institutions.id,
        name: institutions.name,
        origin: institutions.origin,
      })
      .from(institutionMembers)
      .innerJoin(institutions, eq(institutions.id, institutionMembers.institutionId))
      .where(
        and(
          eq(institutionMembers.userId, userId),
          eq(institutionMembers.role, 'MANAGER'),
          eq(institutionMembers.status, 'ACTIVE'),
        ),
      )

    if (managed.length === 0) {
      return []
    }

    const others = await db
      .select({
        institutionId: institutionMembers.institutionId,
        role: institutionMembers.role,
      })
      .from(institutionMembers)
      .where(
        and(
          inArray(
            institutionMembers.institutionId,
            managed.map((institution) => institution.id),
          ),
          ne(institutionMembers.userId, userId),
          eq(institutionMembers.status, 'ACTIVE'),
        ),
      )

    return managed.map((institution) => {
      const members = others.filter((other) => other.institutionId === institution.id)

      return {
        ...institution,
        otherMembersCount: members.length,
        otherManagersCount: members.filter((member) => member.role === 'MANAGER').length,
      }
    })
  }

  async anonymizeUser({ userId, name, email, institutionIdsToArchive }: AnonymizeUserParams): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.update(users).set({ name, email, status: 'DELETED' }).where(eq(users.id, userId))

      await tx.update(institutionMembers).set({ status: 'INACTIVE' }).where(eq(institutionMembers.userId, userId))

      if (institutionIdsToArchive.length > 0) {
        await tx
          .update(institutions)
          .set({ status: 'ARCHIVED' })
          .where(inArray(institutions.id, institutionIdsToArchive))
      }
    })
  }
}
