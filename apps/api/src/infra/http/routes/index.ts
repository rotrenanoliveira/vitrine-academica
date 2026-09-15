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
import { updateInstitutionMemberStatusRoute } from './institutions-membership/update-institution-member-status'
import { fetchUserPreferenceTagsRoute } from './preference-tags/fetch-user-preference-tags'
import { registerPreferenceTagRoute } from './preference-tags/register-preference-tag'
import { fetchMyProjectsRoute } from './projects/fetch-my-projects'
import { fetchProjectsOfInterestRoute } from './projects/fetch-projects-of-interest'
import { fetchPublishedProjectsRoute } from './projects/fetch-published-projects'
import { fetchPublishedProjectsTodayRoute } from './projects/fetch-published-projects-today'
import { getProjectByIdRoute } from './projects/get-project-by-id'
import { publishScheduledProjectsRoute } from './projects/publish-scheduled-projects'
import { registerProjectRoute } from './projects/register-project'
import { registerProjectTagRoute } from './projects/register-project-tag'
import { scheduleProjectRoute } from './projects/schedule-project'
import { updateProjectRoute } from './projects/update-project'
import { fetchProjectsByTagRoute } from './tags/fetch-projects-by-tag'
import { fetchTagsRoute } from './tags/fetch-tags'
import { registerTagRoute } from './tags/register-tag'
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
  /** PUT /projects/:projectId */
  await app.register(updateProjectRoute)
  /** GET /projects/:projectId */
  await app.register(getProjectByIdRoute)

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
