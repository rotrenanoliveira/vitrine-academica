'use server'

import { fetcher } from '@/utils/fetcher'
import type { Attachment } from '@/utils/type'
import { api } from '../../api-client'

type GetAttachmentResponse = {
  attachment: Attachment
  attachmentUrl: string
}

export async function getAttachment(attachmentId: string) {
  return await fetcher(api.get<GetAttachmentResponse>(`api/v1/attachments/${attachmentId}`).json(), { notFound: false })
}
