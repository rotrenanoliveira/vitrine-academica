import { revalidatePath, updateTag } from 'next/cache'

export function revalidateTags() {
  updateTag('tags')
  revalidatePath('/')
  revalidatePath('/conta')
}
