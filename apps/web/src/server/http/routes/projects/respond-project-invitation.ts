'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectMember } from '@/utils/project-member-types'
import { api } from '../../api-client'

type RespondProjectInvitationParams = {
  invitationId: string
  status: 'ACCEPTED' | 'REJECTED'
}

export async function respondProjectInvitation({ invitationId, status }: RespondProjectInvitationParams) {
  return await fetcher(
    api
      .post<{ projectMember: ProjectMember }>(`api/v1/projects/invitations/${invitationId}/respond`, {
        json: { status },
      })
      .json(),
    { throw: false, notFound: false },
  )
}
