import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeAuthorSubscriptionOnDatabase } from '@tests/factories/make-author-subscription'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallApplicationOnDatabase } from '@tests/factories/make-call-application'
import { makeEventOnDatabase } from '@tests/factories/make-event'
import { makeEventRegistrationOnDatabase } from '@tests/factories/make-event-registration'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMembershipRequestOnDatabase } from '@tests/factories/make-institution-membership-request'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectMemberOnDatabase } from '@tests/factories/make-project-member'
import { makeProjectStarOnDatabase } from '@tests/factories/make-project-star'
import { makeProjectTeacherRatingOnDatabase } from '@tests/factories/make-project-teacher-rating'
import { makePromotionOnDatabase } from '@tests/factories/make-promotion'
import { makeRatingCriterionOnDatabase } from '@tests/factories/make-rating-criterion'
import { makeThemeOnDatabase } from '@tests/factories/make-theme'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { makeVoteOnDatabase } from '@tests/factories/make-vote'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { TeacherRatingItem } from '@/domain/project/enterprise/entities/teacher-rating-item'

async function authenticateUser() {
  const { user } = await makeUserOnDatabase()
  const { account } = await makeAccountOnDatabase({ userId: user.id })
  const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

  const loginResponse = await request(app.server).post('/api/v1/auth/sessions').send({
    email: user.email,
    code: plainCode,
  })

  return {
    accessToken: loginResponse.body.accessToken as string,
    user,
  }
}

describe('(E2E) - GET /api/v1/users/me/export', () => {
  afterAll(async () => await app.close())

  it('should be able to export authenticated user data', async () => {
    const { accessToken, user } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        status: expect.any(String),
      },
      account: {
        id: expect.any(String),
        avatarId: null,
        createdAt: expect.any(String),
        confirmationAt: expect.any(String),
        consentedAt: null,
        updatedAt: expect.any(String),
      },
      sessions: expect.any(Array),
      institutions: expect.any(Array),
      preferences: expect.any(Array),
      points: {
        balance: 0,
        transactions: [],
      },
      projects: [],
      projectStars: [],
      promotions: [],
      projectMembers: [],
      calls: [],
      callApplications: [],
      teacherRatings: [],
      institutionMembershipRequests: [],
      registeredInstitutions: [],
      eventThemes: [],
      eventVotes: [],
      eventRegistrations: [],
      authorSubscriptions: [],
    })
  })

  it('should export the stars and the promotions given by the user', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: author.id, status: ProjectStatus.PUBLISHED })

    const { projectStar } = await makeProjectStarOnDatabase({ projectId: project.id, userId: user.id, weight: 5 })
    const { promotion } = await makePromotionOnDatabase({ projectId: project.id, promoterId: user.id })

    const response = await request(app.server)
      .get('/api/v1/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.projectStars).toEqual([
      {
        id: projectStar.id.toString(),
        projectId: project.id.toString(),
        weight: 5,
        active: expect.any(Boolean),
        ratedAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ])
    expect(response.body.promotions).toEqual([
      {
        id: promotion.id.toString(),
        projectId: project.id.toString(),
        cost: promotion.cost,
        status: 'ACTIVE',
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ])
  })

  it('should export the records the user created, gave or received', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: other } = await makeUserOnDatabase()

    const { project: ownProject } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })
    const { project: otherProject } = await makeProjectOnDatabase({
      author: other.id,
      status: ProjectStatus.PUBLISHED,
    })

    const { projectMember } = await makeProjectMemberOnDatabase({ projectId: otherProject.id, userId: user.id })

    const { call } = await makeCallOnDatabase({ authorId: user.id })
    const { call: otherCall } = await makeCallOnDatabase({ authorId: other.id })
    const { application } = await makeCallApplicationOnDatabase({ callId: otherCall.id, applicantId: user.id })

    const { criterion } = await makeRatingCriterionOnDatabase()
    const ratingId = new UniqueEntityId()
    const { teacherRating } = await makeProjectTeacherRatingOnDatabase(
      {
        projectId: otherProject.id,
        teacherId: user.id,
        overallScore: 9,
        items: [TeacherRatingItem.create({ ratingId, criterionId: criterion.id, score: 9 })],
      },
      ratingId,
    )

    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    const { request: membershipRequest } = await makeInstitutionMembershipRequestOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
    })

    const { event } = await makeEventOnDatabase({ institutionId: institution.id })
    const { theme } = await makeThemeOnDatabase({ eventId: event.id, authorId: user.id })
    const { vote } = await makeVoteOnDatabase({ eventId: event.id, themeId: theme.id, userId: user.id })
    const { registration } = await makeEventRegistrationOnDatabase({
      eventId: event.id,
      projectId: ownProject.id,
      responsibleUserId: user.id,
    })

    const { subscription } = await makeAuthorSubscriptionOnDatabase({
      subscriberId: user.id,
      authorId: other.id,
      email: 'seguidor@example.com',
    })
    await makeAuthorSubscriptionOnDatabase({ subscriberId: other.id, authorId: user.id })

    const response = await request(app.server)
      .get('/api/v1/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)

    expect(response.body.projects).toEqual([
      expect.objectContaining({ id: ownProject.id.toString(), title: ownProject.title, status: 'PUBLISHED' }),
    ])
    expect(response.body.projectMembers).toEqual([
      expect.objectContaining({ id: projectMember.id.toString(), projectId: otherProject.id.toString() }),
    ])
    expect(response.body.calls).toEqual([expect.objectContaining({ id: call.id.toString(), title: call.title })])
    expect(response.body.callApplications).toEqual([
      expect.objectContaining({ id: application.id.toString(), callId: otherCall.id.toString() }),
    ])
    expect(response.body.teacherRatings).toEqual([
      expect.objectContaining({
        id: teacherRating.id.toString(),
        projectId: otherProject.id.toString(),
        overallScore: 9,
        items: [{ criterionId: criterion.id.toString(), score: 9 }],
      }),
    ])
    expect(response.body.institutionMembershipRequests).toEqual([
      expect.objectContaining({ id: membershipRequest.id.toString(), institutionId: institution.id.toString() }),
    ])
    expect(response.body.registeredInstitutions).toEqual([
      expect.objectContaining({ id: institution.id.toString(), name: institution.name }),
    ])
    expect(response.body.eventThemes).toEqual([
      expect.objectContaining({ id: theme.id.toString(), eventId: event.id.toString(), title: theme.title }),
    ])
    expect(response.body.eventVotes).toEqual([
      expect.objectContaining({ id: vote.id.toString(), themeId: theme.id.toString() }),
    ])
    expect(response.body.eventRegistrations).toEqual([
      expect.objectContaining({ id: registration.id.toString(), projectId: ownProject.id.toString() }),
    ])
    expect(response.body.authorSubscriptions).toEqual([
      expect.objectContaining({
        id: subscription.id.toString(),
        authorId: other.id.toString(),
        email: 'seguidor@example.com',
      }),
    ])
    expect(response.body.authorSubscriptions[0]).not.toHaveProperty('unsubscribeToken')
  })

  it('should not export the records that belong to other users', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: other } = await makeUserOnDatabase()

    await makeProjectOnDatabase({ author: other.id, status: ProjectStatus.PUBLISHED })
    await makeCallOnDatabase({ authorId: other.id })
    await makeAuthorSubscriptionOnDatabase({ subscriberId: other.id, authorId: user.id })

    const response = await request(app.server)
      .get('/api/v1/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.projects).toEqual([])
    expect(response.body.calls).toEqual([])
    expect(response.body.authorSubscriptions).toEqual([])
  })

  it('should not be able to export user data without authentication', async () => {
    const response = await request(app.server).get('/api/v1/users/me/export')

    expect(response.status).toBe(401)

    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
