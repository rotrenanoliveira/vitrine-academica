import { revalidatePath } from 'next/cache'

export function revalidateProjectMembers(projectSlug?: string) {
  revalidatePath('/me')
  revalidatePath('/me/convites')
  revalidatePath('/me/projetos')

  if (projectSlug) {
    revalidatePath(`/projetos/${projectSlug}`)
  }
}
