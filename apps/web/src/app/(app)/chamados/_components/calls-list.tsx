import { CallsTable } from '@/components/call/calls-table'
import { fetchCalls } from '@/server/http/routes/calls/fetch-calls'
import type { Tag } from '@/utils/type'

type CallsListProps = {
  tagId?: string
  tags: Tag[]
}

export async function CallsList({ tagId, tags }: CallsListProps) {
  const { calls } = await fetchCalls({ tagId })

  return <CallsTable data={calls} tags={tags} />
}