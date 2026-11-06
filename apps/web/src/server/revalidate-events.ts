import { revalidatePath } from 'next/cache'

export function revalidateEvents(slugOrId?: string) {
  revalidatePath('/eventos')
  revalidatePath('/instituicoes', 'layout')

  if (slugOrId) {
    revalidatePath(`/eventos/${slugOrId}`)
    revalidatePath(`/eventos/${slugOrId}/escolha`)
    revalidatePath(`/eventos/${slugOrId}/inscrever`)
    revalidatePath(`/eventos/${slugOrId}/editar`)
  }

  revalidatePath('/projetos')
}
