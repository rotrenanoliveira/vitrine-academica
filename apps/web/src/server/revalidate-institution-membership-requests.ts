import { revalidatePath, updateTag } from 'next/cache'

export function revalidateInstitutionMembershipRequests(slug?: string) {
  updateTag('institution-membership-requests')
  revalidatePath('/me')
  revalidatePath('/me/instituicoes')
  revalidatePath('/me/instituicoes/solicitar')

  if (slug) {
    revalidatePath(`/instituicoes/${slug}`)
    revalidatePath(`/instituicoes/${slug}/solicitacoes`)
  }
}
