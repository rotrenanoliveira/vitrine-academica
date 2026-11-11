import { revalidatePath } from 'next/cache'

export function revalidateProjectMembers(projectSlug?: string) {
  revalidatePath('/projetos/convites')

  if (projectSlug) {
    revalidatePath(`/projetos/${projectSlug}`)
  }
}
