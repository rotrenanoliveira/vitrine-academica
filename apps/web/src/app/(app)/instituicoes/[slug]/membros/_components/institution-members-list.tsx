import { getCachedInstitutionMembers } from '@/server/http/routes/institutions/fetch-institution-members'
import { InstitutionMembersTable } from './institution-members-table'

type InstitutionMembersListProps = {
  institutionId: string
  institutionSlug: string
}

export async function InstitutionMembersList({ institutionId, institutionSlug }: InstitutionMembersListProps) {
  const { members } = await getCachedInstitutionMembers(institutionId)

  return <InstitutionMembersTable data={members} institutionId={institutionId} institutionSlug={institutionSlug} />
}
