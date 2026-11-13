import type { FastifyInstance } from 'fastify'
import { getInstitutionsAnalyticsRoute } from './analytics/get-institutions-analytics'
import { getProjectsAnalyticsRoute } from './analytics/get-projects-analytics'
import { getTagsAnalyticsRoute } from './analytics/get-tags-analytics'
import { getUsersAnalyticsRoute } from './analytics/get-users-analytics'
import { deleteAttachmentRoute } from './attachments/delete-attachment'
import { getAttachmentRoute } from './attachments/get-attachment'
import { uploadAttachmentRoute } from './attachments/upload-attachment'
import { authenticateWithAccessCodeRoute } from './auth/authenticate-with-access-code'
import { getMeRoute } from './auth/get-me'
import { logoutRoute } from './auth/logout'
import { requestAccessCodeRoute } from './auth/request-access-code'
import { applyToCallRoute } from './call-applications/apply-to-call'
import { decideCallApplicationRoute } from './call-applications/decide-call-application'
import { fetchCallApplicationsRoute } from './call-applications/fetch-call-applications'
import { fetchMyCallApplicationsRoute } from './call-applications/fetch-my-call-applications'
import { closeCallRoute } from './calls/close-call'
import { fetchCallsRoute } from './calls/fetch-calls'
import { fetchMyCallsRoute } from './calls/fetch-my-calls'
import { getCallByIdRoute } from './calls/get-call-by-id'
import { registerCallRoute } from './calls/register-call'
import { updateCallRoute } from './calls/update-call'
import { getCurationRoute } from './curation/get-curation'
import { createEventRoute } from './events/create-event'
import { editEventNameRoute } from './events/edit-event-name'
import { fetchApprovedParticipantsRoute } from './events/fetch-approved-participants'
import { fetchApprovedThemesRoute } from './events/fetch-approved-themes'
import { fetchEventRegistrationsRoute } from './events/fetch-event-registrations'
import { fetchInstitutionEventsRoute } from './events/fetch-institution-events'
import { fetchPublicEventsRoute } from './events/fetch-public-events'
import { getCurrentThemeSelectionRoute } from './events/get-current-theme-selection'
import { getMyVoteRoute } from './events/get-my-vote'
import { getPublicEventRoute } from './events/get-public-event'
import { getVoteCounterRoute } from './events/get-vote-counter'
import { moderateThemeRoute } from './events/moderate-theme'
import { registerProjectInEventRoute } from './events/register-project-in-event'
import { reviewEventRegistrationRoute } from './events/review-event-registration'
import { selectInstitutionalThemeRoute } from './events/select-institutional-theme'
import { suggestThemeRoute } from './events/suggest-theme'
import { voteThemeRoute } from './events/vote-theme'
import { updateInstitutionRoute } from './institutions/edit-institution'
import { fetchInstitutionProjectsBySlugRoute } from './institutions/fetch-institution-projects-by-slug'
import { fetchInstitutionsRoute } from './institutions/fetch-institutions'
import { getInstitutionByIdRoute } from './institutions/get-institution-by-id'
import { getInstitutionBySlugRoute } from './institutions/get-institution-by-slug'
import { registerInstitutionRoute } from './institutions/register-institution'
import { updateInstitutionStatusRoute } from './institutions/update-institution-status'
import { approveInstitutionMembershipRequestRoute } from './institutions-membership/approve-institution-membership-request'
import { createInstitutionMemberRoute } from './institutions-membership/create-institution-member'
import { fetchInstitutionMembersRoute } from './institutions-membership/fetch-institution-members'
import { fetchInstitutionMembershipRequestsRoute } from './institutions-membership/fetch-institution-membership-requests'
import { fetchMyInstitutionMembershipsRoute } from './institutions-membership/fetch-my-institution-memberships'
import { getInstitutionMemberByIdRoute } from './institutions-membership/get-institution-member-by-id'
import { rejectInstitutionMembershipRequestRoute } from './institutions-membership/reject-institution-membership-request'
import { requestInstitutionMembershipRoute } from './institutions-membership/request-institution-membership'
import { updateInstitutionMemberRoleRoute } from './institutions-membership/update-institution-member-role'
import { updateInstitutionMemberStatusRoute } from './institutions-membership/update-institution-member-status'
import { getMyPointsBalanceRoute } from './points/get-my-points-balance'
import { listActivePromotionsRoute } from './points/list-active-promotions'
import { listMyPointTransactionsRoute } from './points/list-my-point-transactions'
import { promoteProjectRoute } from './points/promote-project'
import { listMySubscriptionsRoute } from './newsletter/list-my-subscriptions'
import { subscribeToAuthorRoute } from './newsletter/subscribe-to-author'
import { unsubscribeByTokenRoute } from './newsletter/unsubscribe-by-token'
import { unsubscribeFromAuthorRoute } from './newsletter/unsubscribe-from-author'
import { deactivatePreferenceTagRoute } from './preference-tags/deactivate-preference-tag'
import { fetchUserPreferenceTagsRoute } from './preference-tags/fetch-user-preference-tags'
import { registerPreferenceTagRoute } from './preference-tags/register-preference-tag'
import { fetchMyProjectsRoute } from './projects/fetch-my-projects'
import { fetchProjectsRoute } from './projects/fetch-projects'
import { fetchProjectsOfInterestRoute } from './projects/fetch-projects-of-interest'
import { fetchPublishedProjectsRoute } from './projects/fetch-published-projects'
import { fetchPublishedProjectsTodayRoute } from './projects/fetch-published-projects-today'
import { fetchScheduledProjectsRoute } from './projects/fetch-scheduled-projects'
import { getMyStarOnProjectRoute } from './projects/get-my-star-on-project'
import { getMyTeacherRatingOnProjectRoute } from './projects/get-my-teacher-rating-on-project'
import { getProjectByIdRoute } from './projects/get-project-by-id'
import { getProjectBySlugRoute } from './projects/get-project-by-slug'
import { getProjectRatingsRoute } from './projects/get-project-ratings'
import { inviteProjectMemberRoute } from './projects/invite-project-member'
import { listActiveRatingCriteriaRoute } from './projects/list-active-rating-criteria'
import { listMyProjectInvitationsRoute } from './projects/list-my-project-invitations'
import { listMyStarredProjectsRoute } from './projects/list-my-starred-projects'
import { listMyTeacherRatingsRoute } from './projects/list-my-teacher-ratings'
import { listProjectMembersRoute } from './projects/list-project-members'
import { listProjectTeacherRatingsRoute } from './projects/list-project-teacher-ratings'
import { publishProjectRoute } from './projects/publish-project'
import { publishScheduledProjectsRoute } from './projects/publish-scheduled-projects'
import { rateProjectByCriteriaRoute } from './projects/rate-project-by-criteria'
import { registerProjectRoute } from './projects/register-project'
import { registerProjectTagRoute } from './projects/register-project-tag'
import { removeProjectTagRoute } from './projects/remove-project-tag'
import { respondProjectInvitationRoute } from './projects/respond-project-invitation'
import { scheduleProjectRoute } from './projects/schedule-project'
import { searchExternalProjectsRoute } from './projects/search-external-projects'
import { starProjectRoute } from './projects/star-project'
import { unstarProjectRoute } from './projects/unstar-project'
import { updateProjectRoute } from './projects/update-project'
import { fetchProjectsByTagRoute } from './tags/fetch-projects-by-tag'
import { fetchTagsRoute } from './tags/fetch-tags'
import { registerTagRoute } from './tags/register-tag'
import { deleteUserAccountRoute } from './users/delete-user-account'
import { exportUserDataRoute } from './users/export-user-data'
import { findUserByIdRoute } from './users/find-user-by-id'
import { registerUserRoute } from './users/register-user'

/**
 * Routes prefix: /api/v1
 */
export async function routes(app: FastifyInstance) {
  /** Analytics routes */
  /** GET /analytics/projects */
  await app.register(getProjectsAnalyticsRoute)
  /** GET /analytics/users */
  await app.register(getUsersAnalyticsRoute)
  /** GET /analytics/institutions */
  await app.register(getInstitutionsAnalyticsRoute)
  /** GET /analytics/tags */
  await app.register(getTagsAnalyticsRoute)
  /** Attachments routes */
  /** POST /attachments */
  await app.register(uploadAttachmentRoute)
  /** GET /attachments/:attachmentId */
  await app.register(getAttachmentRoute)
  /** DELETE /attachments/:attachmentId */
  await app.register(deleteAttachmentRoute)

  /** Auth routes */
  /** POST /auth/access-code */
  await app.register(requestAccessCodeRoute)
  /** POST /auth/sessions */
  await app.register(authenticateWithAccessCodeRoute)
  /** DELETE /auth/sessions */
  await app.register(logoutRoute)
  /** GET /auth/me */
  await app.register(getMeRoute)

  /** Events routes */
  /** GET /events */
  await app.register(fetchPublicEventsRoute)
  /** GET /events/:eventIdOrSlug */
  await app.register(getPublicEventRoute)
  /** GET /events/:eventId/themes */
  await app.register(fetchApprovedThemesRoute)
  /** GET /events/:eventId/participants */
  await app.register(fetchApprovedParticipantsRoute)
  /** GET /institutions/:institutionId/events */
  await app.register(fetchInstitutionEventsRoute)
  /** POST /institutions/:institutionId/events */
  await app.register(createEventRoute)
  /** PATCH /events/:eventId */
  await app.register(editEventNameRoute)
  /** POST /events/:eventId/themes */
  await app.register(suggestThemeRoute)
  /** PATCH /events/themes/:themeId/moderation */
  await app.register(moderateThemeRoute)
  /** POST /events/:eventId/votes */
  await app.register(voteThemeRoute)
  /** GET /events/:eventId/votes/me */
  await app.register(getMyVoteRoute)
  /** GET /events/:eventId/theme-selection */
  await app.register(getCurrentThemeSelectionRoute)
  /** GET /events/:eventId/vote-counter */
  await app.register(getVoteCounterRoute)
  /** POST /events/:eventId/select-theme */
  await app.register(selectInstitutionalThemeRoute)
  /** POST /events/:eventId/registrations */
  await app.register(registerProjectInEventRoute)
  /** GET /events/:eventId/registrations */
  await app.register(fetchEventRegistrationsRoute)
  /** PATCH /events/registrations/:registrationId/review */
  await app.register(reviewEventRegistrationRoute)

  /** Users routes */
  /** POST /users */
  await app.register(registerUserRoute)
  /** GET /users/:userId */
  await app.register(findUserByIdRoute)
  /** GET /users/me/export */
  await app.register(exportUserDataRoute)
  /** DELETE /users/me */
  await app.register(deleteUserAccountRoute)

  /** Tags routes */
  /** POST /tags */
  await app.register(registerTagRoute)
  /** GET /tags */
  await app.register(fetchTagsRoute)
  /** GET /tags/:tagId/projects */
  await app.register(fetchProjectsByTagRoute)

  /** Preference tags routes */
  /** POST /preference-tags */
  await app.register(registerPreferenceTagRoute)
  /** POST /preference-tags/:tagId/deactivate */
  await app.register(deactivatePreferenceTagRoute)
  /** GET /users/:userId/preference-tags */
  await app.register(fetchUserPreferenceTagsRoute)

  /** Projects routes */
  /** POST /projects */
  await app.register(registerProjectRoute)
  /** GET /projects */
  await app.register(fetchProjectsRoute)
  /** GET /projects/me */
  await app.register(fetchMyProjectsRoute)
  /** POST /projects/publish-scheduled */
  await app.register(publishScheduledProjectsRoute)
  /** GET /projects/published */
  await app.register(fetchPublishedProjectsRoute)
  /** GET /projects/published/today */
  await app.register(fetchPublishedProjectsTodayRoute)
  /** POST /projects/:projectId/schedule */
  await app.register(scheduleProjectRoute)
  /** POST /projects/:projectId/publish-now */
  await app.register(publishProjectRoute)
  /** PUT /projects/:projectId */
  await app.register(updateProjectRoute)
  /** GET /projects/slug/:slug */
  await app.register(getProjectBySlugRoute)
  /** GET /projects/:projectId */
  await app.register(getProjectByIdRoute)
  /** POST /projects/:projectId/stars */
  await app.register(starProjectRoute)
  /** DELETE /projects/:projectId/stars */
  await app.register(unstarProjectRoute)
  /** GET /projects/:projectId/stars/me */
  await app.register(getMyStarOnProjectRoute)
  /** GET /projects/:projectId/ratings */
  await app.register(getProjectRatingsRoute)
  /** PUT /projects/:projectId/teacher-ratings */
  await app.register(rateProjectByCriteriaRoute)
  /** GET /projects/:projectId/teacher-ratings/me */
  await app.register(getMyTeacherRatingOnProjectRoute)
  /** GET /projects/:projectId/teacher-ratings */
  await app.register(listProjectTeacherRatingsRoute)
  /** GET /rating-criteria */
  await app.register(listActiveRatingCriteriaRoute)
  /** GET /me/starred-projects */
  await app.register(listMyStarredProjectsRoute)
  /** GET /me/teacher-ratings */
  await app.register(listMyTeacherRatingsRoute)
  /** GET /projects/external-search */
  await app.register(searchExternalProjectsRoute)
  /** GET /projects/scheduled/soon */
  await app.register(fetchScheduledProjectsRoute)

  /** Project members routes */
  /** POST /projects/:projectId/members */
  await app.register(inviteProjectMemberRoute)
  /** GET /projects/invitations/me */
  await app.register(listMyProjectInvitationsRoute)
  /** POST /projects/invitations/:invitationId/respond */
  await app.register(respondProjectInvitationRoute)
  /** GET /projects/:projectId/members */
  await app.register(listProjectMembersRoute)

  /** Project tags routes */
  /** POST /projects/:projectId/tags */
  await app.register(registerProjectTagRoute)
  /** DELETE /projects/:projectId/tags/:tagId */
  await app.register(removeProjectTagRoute)
  /** GET /users/:userId/projects-of-interest */
  await app.register(fetchProjectsOfInterestRoute)

  /** Curation routes */
  /** GET /curation */
  await app.register(getCurationRoute)

  /** Points routes */
  /** GET /points/me */
  await app.register(getMyPointsBalanceRoute)
  /** GET /points/me/transactions */
  await app.register(listMyPointTransactionsRoute)
  /** POST /projects/:projectId/promotions */
  await app.register(promoteProjectRoute)
  /** GET /promotions/active */
  await app.register(listActivePromotionsRoute)
  /** Newsletter routes */
  /** POST /authors/:authorId/subscriptions */
  await app.register(subscribeToAuthorRoute)
  /** GET /subscriptions/me */
  await app.register(listMySubscriptionsRoute)
  /** POST /subscriptions/:subscriptionId/unsubscribe */
  await app.register(unsubscribeFromAuthorRoute)
  /** POST /subscriptions/unsubscribe */
  await app.register(unsubscribeByTokenRoute)

  /** Institutions routes */
  /** POST /institutions */
  await app.register(registerInstitutionRoute)
  /** GET /institutions */
  await app.register(fetchInstitutionsRoute)
  /** GET /institutions/me */
  await app.register(fetchMyInstitutionMembershipsRoute)
  /** GET /institutions/slug/:slug */
  await app.register(getInstitutionBySlugRoute)
  /** GET /institutions/slug/:slug/projects */
  await app.register(fetchInstitutionProjectsBySlugRoute)
  /** POST /institutions/:institutionId/status */
  await app.register(updateInstitutionStatusRoute)
  /** PUT /institutions/:institutionId */
  await app.register(updateInstitutionRoute)
  /** GET /institutions/:institutionId */
  await app.register(getInstitutionByIdRoute)
  /** POST /institutions/:institutionId/members */
  await app.register(createInstitutionMemberRoute)
  /** POST /institutions/:institutionId/members/:memberId/status */
  await app.register(updateInstitutionMemberStatusRoute)
  /** POST /institutions/:institutionId/members/:memberId/role */
  await app.register(updateInstitutionMemberRoleRoute)
  /** GET /institutions/:institutionId/members */
  await app.register(fetchInstitutionMembersRoute)
  /** GET /institutions/:institutionId/members/:memberId */
  await app.register(getInstitutionMemberByIdRoute)
  /** POST /institutions/:institutionId/membership-requests */
  await app.register(requestInstitutionMembershipRoute)
  /** POST /institutions/:institutionId/membership-requests/:requestId/approve */
  await app.register(approveInstitutionMembershipRequestRoute)
  /** POST /institutions/:institutionId/membership-requests/:requestId/reject */
  await app.register(rejectInstitutionMembershipRequestRoute)
  /** GET /institutions/:institutionId/membership-requests */
  await app.register(fetchInstitutionMembershipRequestsRoute)

  await app.register(registerCallRoute)
  await app.register(getCallByIdRoute)
  await app.register(fetchMyCallsRoute)
  await app.register(fetchCallsRoute)
  await app.register(updateCallRoute)
  await app.register(closeCallRoute)

  await app.register(applyToCallRoute)
  await app.register(fetchCallApplicationsRoute)
  await app.register(decideCallApplicationRoute)
  await app.register(fetchMyCallApplicationsRoute)
}
