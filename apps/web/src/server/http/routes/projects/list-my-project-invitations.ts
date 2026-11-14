'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectInvitation, ProjectMemberStatus } from '@/utils/project-member-types'
import { api } from '../../api-client'

type ListMyProjectInvitationsParams = {
  status?: ProjectMemberStatus
}

export async function listMyProjectInvitations({ status }: ListMyProjectInvitationsParams = {}) {
  const [response, responseError] = await fetcher(
    api
      .get<{ invitations: ProjectInvitation[] }>('api/v1/projects/invitations/me', {
        cache: 'no-store',
        searchParams: status ? { status } : undefined,
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
