'use server'

import type { Project } from '@/utils/type'
import { getAttachment } from '../http/routes/attachments/get-attachment'

export async function resolveProjectCoverUrl(project: Project): Promise<string | null> {
  const coverAttachmentId = project.coverUrl

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

export type ProjectAttachmentPreview = {
  id: string
  url: string
}

export async function resolveProjectAttachmentUrls(project: Project): Promise<ProjectAttachmentPreview[]> {
  const results = await Promise.all(
    project.attachments.map(async (attachmentId) => {
      const [attachmentResult] = await getAttachment(attachmentId)

      if (!attachmentResult) {
        return null
      }

      if (!attachmentResult.attachment.mimeType.startsWith('image/')) {
        return null
      }

      return {
        id: attachmentId,
        url: attachmentResult.attachmentUrl,
      }
    }),
  )

  return results.filter((item): item is ProjectAttachmentPreview => item !== null)
}
