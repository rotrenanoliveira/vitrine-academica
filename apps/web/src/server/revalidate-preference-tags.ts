import { revalidatePath, updateTag } from 'next/cache'

export function revalidatePreferenceTags() {
  updateTag('preference-tags')
  updateTag('projects')
  revalidatePath('/')
  revalidatePath('/conta')
}
