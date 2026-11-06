'use server'

import { fetcher } from '@/utils/fetcher'
import type { Event } from '@/utils/type'
import { api } from '../../api-client'

export async function editEventName(input: { eventId: string; name: string }) {
  return fetcher(api.patch(`api/v1/events/${input.eventId}`, { json: { name: input.name } }).json<{ event: Event }>())
}
