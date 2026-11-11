'use server'

import type { CallApplication } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type ApplyToCallParams = {
  callId: string
  message?: string
}

export async function applyToCall({ callId, message }: ApplyToCallParams) {
  return await fetcher(
    api.post<{ application: CallApplication }>(`api/v1/calls/${callId}/applications`, { json: { message } }).json(),
    { notFound: false },
  )
}
