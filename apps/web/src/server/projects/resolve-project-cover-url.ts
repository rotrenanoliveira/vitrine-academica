'use server'

import type { Project } from '@/utils/type'
import { getAttachment } from '../http/routes/attachments/get-attachment'

export async function resolveProjectCoverUrl(project: Project): Promise<string | null> {
  const coverAttachmentId = project.attachments[0]

  if (!coverAttachmentId) {
    return null
  }

  const [attachmentResult] = await getAttachment(coverAttachmentId)

  if (!attachmentResult) {
    return null
  }

  return attachmentResult.attachmentUrl
}

export async function resolveProjectsWithCover<T extends Project>(
  projects: T[],
): Promise<Array<T & { coverUrl: string | null }>> {
  return Promise.all(
    projects.map(async (project) => ({
      ...project,
      coverUrl: await resolveProjectCoverUrl(project),
    })),
  )
}
