import { revalidatePath, updateTag } from 'next/cache'

export function revalidateProjects(slug?: string) {
  updateTag('projects')
  revalidatePath('/')
  revalidatePath('/projetos')
  revalidatePath('/projetos/promovidos')
  revalidatePath('/projetos/novo')

  if (slug) {
    revalidatePath(`/projetos/${slug}`)
    revalidatePath(`/projetos/${slug}/editar`)
  }
}
