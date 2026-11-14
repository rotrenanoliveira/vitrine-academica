import { revalidatePath, updateTag } from 'next/cache'

export function revalidateCalls(id?: string) {
  updateTag('calls')
  revalidatePath('/chamados')
  revalidatePath('/chamados/novo')
  revalidatePath('/me')
  revalidatePath('/me/chamados')
  revalidatePath('/me/candidaturas')

  if (id) {
    revalidatePath(`/chamados/${id}`)
    revalidatePath(`/chamados/${id}/editar`)
  }
}
