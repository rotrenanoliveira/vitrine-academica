'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectMember } from '@/utils/project-member-types'
import { api } from '../../api-client'

type InviteProjectMemberParams = {
  projectId: string
  email: string
}

export async function inviteProjectMember({ projectId, email }: InviteProjectMemberParams) {
  return await fetcher(
    api
      .post<{ projectMember: ProjectMember }>(`api/v1/projects/${projectId}/members`, {
        json: { email },
      })
      .json(),
    { throw: false, notFound: false },
  )
}
