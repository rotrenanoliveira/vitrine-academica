'use server'

import { fetcher } from '@/utils/fetcher'
import type { Attachment } from '@/utils/type'
import { api } from '../../api-client'

type UploadAttachmentParams = {
  name: string
  mimeType: string
  size: number
  attachmentFolder: string
}

type UploadAttachmentResponse = {
  attachment: Attachment
  uploadUrl: string
  expiresIn: number
}

export async function uploadAttachment(data: UploadAttachmentParams) {
  return await fetcher(api.post<UploadAttachmentResponse>('api/v1/attachments', { json: data }).json())
}
