import { revalidatePath } from 'next/cache'

export function revalidateProjectMembers(projectId?: string) {
  revalidatePath('/projetos/convites')

  if (projectId) {
    revalidatePath(`/projetos/${projectId}`)
  }
}
