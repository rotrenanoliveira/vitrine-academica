'use server'

import type { CallApplication, CallDecision } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type DecideCallApplicationParams = {
  callId: string
  applicationId: string
  decision: CallDecision
}

export async function decideCallApplication({ callId, applicationId, decision }: DecideCallApplicationParams) {
  return await fetcher(
    api
      .post<{ application: CallApplication; notified: boolean }>(
        `api/v1/calls/${callId}/applications/${applicationId}/decision`,
        { json: { decision } },
      )
      .json(),
    { notFound: false },
  )
}