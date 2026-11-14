import { count, desc, eq, gte, sql } from 'drizzle-orm'
import type {
  AnalyticsRepository,
  DailyCount,
  LabelCount,
  TagUsage,
} from '@/domain/analytics/application/repositories/analytics-repository'
import type { DrizzleClient } from '../drizzle/client'
import { institutionMembers } from '../drizzle/schemas/institution-members'
import { institutionMembershipRequests } from '../drizzle/schemas/institution-membership-requests'
import { institutions } from '../drizzle/schemas/institutions'
import { projectTags } from '../drizzle/schemas/project-tags'
import { projects } from '../drizzle/schemas/projects'
import { tags } from '../drizzle/schemas/tags'
import { users } from '../drizzle/schemas/users'

export class DrizzleAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async countProjectsByStatus(): Promise<LabelCount[]> {
    return this.db.select({ label: projects.status, total: count() }).from(projects).groupBy(projects.status)
  }

  async countProjectsCreatedByDay(since: Date): Promise<DailyCount[]> {
    const day = sql<string>`to_char(${projects.createdAt}, 'YYYY-MM-DD')`

    return this.db
      .select({ date: day, total: count() })
      .from(projects)
      .where(gte(projects.createdAt, since))
      .groupBy(day)
      .orderBy(day)
  }

  async countUsersByStatus(): Promise<LabelCount[]> {
    return this.db.select({ label: users.status, total: count() }).from(users).groupBy(users.status)
  }

  async countUsersCreatedByDay(since: Date): Promise<DailyCount[]> {
    const day = sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`

    return this.db
      .select({ date: day, total: count() })
      .from(users)
      .where(gte(users.createdAt, since))
      .groupBy(day)
      .orderBy(day)
  }

  async countInstitutionsByStatus(): Promise<LabelCount[]> {
    return this.db
      .select({ label: institutions.status, total: count() })
      .from(institutions)
      .groupBy(institutions.status)
  }

  async countActiveMembersByRole(): Promise<LabelCount[]> {
    return this.db
      .select({ label: institutionMembers.role, total: count() })
      .from(institutionMembers)
      .where(eq(institutionMembers.status, 'ACTIVE'))
      .groupBy(institutionMembers.role)
  }

  async countPendingMembershipRequests(): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(institutionMembershipRequests)
      .where(eq(institutionMembershipRequests.status, 'PENDING'))

    return row?.total ?? 0
  }

  async findMostUsedTags(limit: number): Promise<TagUsage[]> {
    const total = count()

    return this.db
      .select({ tagId: tags.id, name: tags.name, slug: tags.slug, total })
      .from(projectTags)
      .innerJoin(tags, eq(projectTags.tagId, tags.id))
      .groupBy(tags.id, tags.name, tags.slug)
      .orderBy(desc(total), tags.name)
      .limit(limit)
  }
}
