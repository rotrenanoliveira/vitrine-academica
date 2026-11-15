import { desc, eq, inArray } from 'drizzle-orm'
import type {
  ExportedAuthorSubscription,
  ExportedCall,
  ExportedCallApplication,
  ExportedEventRegistration,
  ExportedEventTheme,
  ExportedEventVote,
  ExportedInstitution,
  ExportedInstitutionMembershipRequest,
  ExportedProject,
  ExportedProjectMember,
  ExportedProjectStar,
  ExportedPromotion,
  ExportedTeacherRating,
  UserDataExportRepository,
  UserExportedRecords,
} from '@/domain/identity/application/repositories/user-data-export-repository'
import type { DrizzleClient } from '../drizzle/client'
import { projectStars, promotions } from '../drizzle/schemas'
import { authorSubscriptions } from '../drizzle/schemas/author-subscriptions'
import { callApplications } from '../drizzle/schemas/call-applications'
import { calls } from '../drizzle/schemas/calls'
import { eventRegistrations } from '../drizzle/schemas/event-registrations'
import { eventThemes } from '../drizzle/schemas/event-themes'
import { eventVotes } from '../drizzle/schemas/event-votes'
import { institutionMembershipRequests } from '../drizzle/schemas/institution-membership-requests'
import { institutions } from '../drizzle/schemas/institutions'
import { projectMembers } from '../drizzle/schemas/project-members'
import { projectTeacherRatings } from '../drizzle/schemas/project-teacher-ratings'
import { projects } from '../drizzle/schemas/projects'
import { teacherRatingItems } from '../drizzle/schemas/teacher-rating-items'

export class DrizzleUserDataExportRepository implements UserDataExportRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findRecordsByUserId(userId: string): Promise<UserExportedRecords> {
    const [
      projectRecords,
      projectStarRecords,
      promotionRecords,
      projectMemberRecords,
      callRecords,
      callApplicationRecords,
      teacherRatingRecords,
      membershipRequestRecords,
      institutionRecords,
      eventThemeRecords,
      eventVoteRecords,
      eventRegistrationRecords,
      authorSubscriptionRecords,
    ] = await Promise.all([
      this.findProjects(userId),
      this.findProjectStars(userId),
      this.findPromotions(userId),
      this.findProjectMembers(userId),
      this.findCalls(userId),
      this.findCallApplications(userId),
      this.findTeacherRatings(userId),
      this.findInstitutionMembershipRequests(userId),
      this.findRegisteredInstitutions(userId),
      this.findEventThemes(userId),
      this.findEventVotes(userId),
      this.findEventRegistrations(userId),
      this.findAuthorSubscriptions(userId),
    ])

    return {
      projects: projectRecords,
      projectStars: projectStarRecords,
      promotions: promotionRecords,
      projectMembers: projectMemberRecords,
      calls: callRecords,
      callApplications: callApplicationRecords,
      teacherRatings: teacherRatingRecords,
      institutionMembershipRequests: membershipRequestRecords,
      registeredInstitutions: institutionRecords,
      eventThemes: eventThemeRecords,
      eventVotes: eventVoteRecords,
      eventRegistrations: eventRegistrationRecords,
      authorSubscriptions: authorSubscriptionRecords,
    }
  }

  private async findProjects(userId: string): Promise<ExportedProject[]> {
    return this.db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        description: projects.description,
        status: projects.status,
        coverUrl: projects.coverUrl,
        attachments: projects.attachments,
        tags: projects.tags,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.authorId, userId))
      .orderBy(desc(projects.createdAt), desc(projects.id))
  }

  private async findProjectStars(userId: string): Promise<ExportedProjectStar[]> {
    return this.db
      .select({
        id: projectStars.id,
        projectId: projectStars.projectId,
        weight: projectStars.weight,
        active: projectStars.active,
        ratedAt: projectStars.ratedAt,
        createdAt: projectStars.createdAt,
      })
      .from(projectStars)
      .where(eq(projectStars.userId, userId))
      .orderBy(desc(projectStars.ratedAt), desc(projectStars.id))
  }

  private async findPromotions(userId: string): Promise<ExportedPromotion[]> {
    return this.db
      .select({
        id: promotions.id,
        projectId: promotions.projectId,
        cost: promotions.cost,
        status: promotions.status,
        expiresAt: promotions.expiresAt,
        createdAt: promotions.createdAt,
      })
      .from(promotions)
      .where(eq(promotions.promoterId, userId))
      .orderBy(desc(promotions.createdAt), desc(promotions.id))
  }

  private async findProjectMembers(userId: string): Promise<ExportedProjectMember[]> {
    return this.db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        status: projectMembers.status,
        createdAt: projectMembers.createdAt,
      })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId))
      .orderBy(desc(projectMembers.createdAt), desc(projectMembers.id))
  }

  private async findCalls(userId: string): Promise<ExportedCall[]> {
    return this.db
      .select({
        id: calls.id,
        title: calls.title,
        description: calls.description,
        applicationDeadline: calls.applicationDeadline,
        status: calls.status,
        projectId: calls.projectId,
        createdAt: calls.createdAt,
      })
      .from(calls)
      .where(eq(calls.authorId, userId))
      .orderBy(desc(calls.createdAt), desc(calls.id))
  }

  private async findCallApplications(userId: string): Promise<ExportedCallApplication[]> {
    return this.db
      .select({
        id: callApplications.id,
        callId: callApplications.callId,
        message: callApplications.message,
        status: callApplications.status,
        decidedAt: callApplications.decidedAt,
        createdAt: callApplications.createdAt,
      })
      .from(callApplications)
      .where(eq(callApplications.applicantId, userId))
      .orderBy(desc(callApplications.createdAt), desc(callApplications.id))
  }

  private async findTeacherRatings(userId: string): Promise<ExportedTeacherRating[]> {
    const ratings = await this.db
      .select({
        id: projectTeacherRatings.id,
        projectId: projectTeacherRatings.projectId,
        overallScore: projectTeacherRatings.overallScore,
        ratedAt: projectTeacherRatings.ratedAt,
        createdAt: projectTeacherRatings.createdAt,
      })
      .from(projectTeacherRatings)
      .where(eq(projectTeacherRatings.teacherId, userId))
      .orderBy(desc(projectTeacherRatings.ratedAt), desc(projectTeacherRatings.id))

    if (ratings.length === 0) {
      return []
    }

    const items = await this.db
      .select({
        ratingId: teacherRatingItems.ratingId,
        criterionId: teacherRatingItems.criterionId,
        score: teacherRatingItems.score,
      })
      .from(teacherRatingItems)
      .where(
        inArray(
          teacherRatingItems.ratingId,
          ratings.map((rating) => rating.id),
        ),
      )

    return ratings.map((rating) => ({
      ...rating,
      items: items
        .filter((item) => item.ratingId === rating.id)
        .map((item) => ({ criterionId: item.criterionId, score: item.score })),
    }))
  }

  private async findInstitutionMembershipRequests(userId: string): Promise<ExportedInstitutionMembershipRequest[]> {
    return this.db
      .select({
        id: institutionMembershipRequests.id,
        institutionId: institutionMembershipRequests.institutionId,
        role: institutionMembershipRequests.role,
        status: institutionMembershipRequests.status,
        proofAttachmentId: institutionMembershipRequests.proofAttachmentId,
        createdAt: institutionMembershipRequests.createdAt,
      })
      .from(institutionMembershipRequests)
      .where(eq(institutionMembershipRequests.userId, userId))
      .orderBy(desc(institutionMembershipRequests.createdAt), desc(institutionMembershipRequests.id))
  }

  private async findRegisteredInstitutions(userId: string): Promise<ExportedInstitution[]> {
    return this.db
      .select({
        id: institutions.id,
        name: institutions.name,
        slug: institutions.slug,
        type: institutions.type,
        status: institutions.status,
        origin: institutions.origin,
        description: institutions.description,
        createdAt: institutions.createdAt,
      })
      .from(institutions)
      .where(eq(institutions.registerBy, userId))
      .orderBy(desc(institutions.createdAt), desc(institutions.id))
  }

  private async findEventThemes(userId: string): Promise<ExportedEventTheme[]> {
    return this.db
      .select({
        id: eventThemes.id,
        eventId: eventThemes.eventId,
        title: eventThemes.title,
        description: eventThemes.description,
        status: eventThemes.status,
        createdAt: eventThemes.createdAt,
      })
      .from(eventThemes)
      .where(eq(eventThemes.authorId, userId))
      .orderBy(desc(eventThemes.createdAt), desc(eventThemes.id))
  }

  private async findEventVotes(userId: string): Promise<ExportedEventVote[]> {
    return this.db
      .select({
        id: eventVotes.id,
        eventId: eventVotes.eventId,
        themeId: eventVotes.themeId,
        createdAt: eventVotes.createdAt,
      })
      .from(eventVotes)
      .where(eq(eventVotes.userId, userId))
      .orderBy(desc(eventVotes.createdAt), desc(eventVotes.id))
  }

  private async findEventRegistrations(userId: string): Promise<ExportedEventRegistration[]> {
    return this.db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        projectId: eventRegistrations.projectId,
        status: eventRegistrations.status,
        registeredAt: eventRegistrations.registeredAt,
      })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.responsibleUserId, userId))
      .orderBy(desc(eventRegistrations.registeredAt), desc(eventRegistrations.id))
  }

  private async findAuthorSubscriptions(userId: string): Promise<ExportedAuthorSubscription[]> {
    return this.db
      .select({
        id: authorSubscriptions.id,
        authorId: authorSubscriptions.authorId,
        email: authorSubscriptions.email,
        status: authorSubscriptions.status,
        subscribedAt: authorSubscriptions.subscribedAt,
        unsubscribedAt: authorSubscriptions.unsubscribedAt,
      })
      .from(authorSubscriptions)
      .where(eq(authorSubscriptions.subscriberId, userId))
      .orderBy(desc(authorSubscriptions.subscribedAt), desc(authorSubscriptions.id))
  }
}
