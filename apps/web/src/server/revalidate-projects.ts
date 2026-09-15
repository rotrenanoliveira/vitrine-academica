import { revalidatePath, updateTag } from 'next/cache'

export function revalidateProjects(id?: string) {
  updateTag('projects')
  revalidatePath('/')
  revalidatePath('/projetos')
  revalidatePath('/projetos/novo')

  if (id) {
    revalidatePath(`/projetos/${id}`)
    revalidatePath(`/projetos/${id}/editar`)
  }
}
