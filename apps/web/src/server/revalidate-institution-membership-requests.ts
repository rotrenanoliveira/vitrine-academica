import { revalidatePath, updateTag } from 'next/cache'

export function revalidateInstitutionMembershipRequests(slug?: string) {
  updateTag('institution-membership-requests')
  revalidatePath('/conta/instituicoes')

  if (slug) {
    revalidatePath(`/instituicoes/${slug}`)
    revalidatePath(`/instituicoes/${slug}/solicitacoes`)
  }
}
