import type { FastifyInstance } from 'fastify'
import { deleteAttachmentRoute } from './attachments/delete-attachment'
import { getAttachmentRoute } from './attachments/get-attachment'
import { uploadAttachmentRoute } from './attachments/upload-attachment'
import { authenticateWithAccessCodeRoute } from './auth/authenticate-with-access-code'
import { getMeRoute } from './auth/get-me'
import { logoutRoute } from './auth/logout'
import { requestAccessCodeRoute } from './auth/request-access-code'
import { updateInstitutionRoute } from './institutions/edit-institution'
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
import { deactivatePreferenceTagRoute } from './preference-tags/deactivate-preference-tag'
import { fetchUserPreferenceTagsRoute } from './preference-tags/fetch-user-preference-tags'
import { registerPreferenceTagRoute } from './preference-tags/register-preference-tag'
import { fetchMyProjectsRoute } from './projects/fetch-my-projects'
import { fetchProjectsOfInterestRoute } from './projects/fetch-projects-of-interest'
import { fetchPublishedProjectsRoute } from './projects/fetch-published-projects'
import { fetchPublishedProjectsTodayRoute } from './projects/fetch-published-projects-today'
import { getMyStarOnProjectRoute } from './projects/get-my-star-on-project'
import { getMyTeacherRatingOnProjectRoute } from './projects/get-my-teacher-rating-on-project'
import { getProjectByIdRoute } from './projects/get-project-by-id'
import { getProjectRatingsRoute } from './projects/get-project-ratings'
import { listActiveRatingCriteriaRoute } from './projects/list-active-rating-criteria'
import { listMyStarredProjectsRoute } from './projects/list-my-starred-projects'
import { listMyTeacherRatingsRoute } from './projects/list-my-teacher-ratings'
import { listProjectTeacherRatingsRoute } from './projects/list-project-teacher-ratings'
import { fetchScheduledProjectsRoute } from './projects/fetch-scheduled-projects'
import { publishProjectRoute } from './projects/publish-project'
import { publishScheduledProjectsRoute } from './projects/publish-scheduled-projects'
import { rateProjectByCriteriaRoute } from './projects/rate-project-by-criteria'
import { registerProjectRoute } from './projects/register-project'
import { registerProjectTagRoute } from './projects/register-project-tag'
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

  /** Project tags routes */
  /** POST /projects/:projectId/tags */
  await app.register(registerProjectTagRoute)
  /** GET /users/:userId/projects-of-interest */
  await app.register(fetchProjectsOfInterestRoute)

  /** Institutions routes */
  /** POST /institutions */
  await app.register(registerInstitutionRoute)
  /** GET /institutions */
  await app.register(fetchInstitutionsRoute)
  /** GET /institutions/me */
  await app.register(fetchMyInstitutionMembershipsRoute)
  /** GET /institutions/slug/:slug */
  await app.register(getInstitutionBySlugRoute)
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
}
