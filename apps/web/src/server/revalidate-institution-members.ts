import { revalidatePath, updateTag } from 'next/cache'

export function revalidateInstitutionMembers(slug?: string) {
  updateTag('institution-members')
  revalidatePath('/me')
  revalidatePath('/me/instituicoes')

  if (slug) {
    revalidatePath(`/instituicoes/${slug}`)
    revalidatePath(`/instituicoes/${slug}/membros`)
    revalidatePath(`/instituicoes/${slug}/editar`)
  }
}
