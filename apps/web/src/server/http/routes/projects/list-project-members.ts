'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectMemberListItem } from '@/utils/project-member-types'
import { api } from '../../api-client'

type ListProjectMembersParams = {
  projectId: string
}

export async function listProjectMembers({ projectId }: ListProjectMembersParams) {
  const [response, responseError] = await fetcher(
    api.get<{ members: ProjectMemberListItem[] }>(`api/v1/projects/${projectId}/members`, { cache: 'no-store' }).json(),
    { throw: false, notFound: false },
  )

  if (responseError) return { members: [] as ProjectMemberListItem[] }

  return response
}
