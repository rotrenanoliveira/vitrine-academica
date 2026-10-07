import { revalidatePath, updateTag } from 'next/cache'

export function revalidateInstitutions(slug?: string) {
  updateTag('institutions')
  revalidatePath('/instituicoes')
  revalidatePath('/instituicoes/novo')

  if (slug) {
    revalidatePath(`/instituicoes/${slug}`)
    revalidatePath(`/instituicoes/${slug}/editar`)
  }
}
