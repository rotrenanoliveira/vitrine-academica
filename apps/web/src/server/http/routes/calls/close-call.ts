'use server'

import type { Call } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function closeCall(callId: string) {
  return await fetcher(api.post<{ call: Call }>(`api/v1/calls/${callId}/close`).json(), { notFound: false })
}