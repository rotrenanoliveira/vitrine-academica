'use server'

import z from 'zod'
import { getCurrentUser } from '../auth/require-user'
import { registerPreferenceTag } from '../http/routes/preference-tags/register-preference-tag'
import { revalidatePreferenceTags } from '../revalidate-preference-tags'

function parseTagIds(data: FormData): string[] {
  return data.getAll('tag-id').map(String).filter(Boolean)
}

const registerPreferenceTagsSchema = z.object({
  tagIds: z.array(z.uuid()).min(1, 'Selecione ao menos uma tag.'),
})

function isAlreadyRegisteredError(message?: string) {
  return Boolean(message?.toLowerCase().includes('já cadastrada'))
}

export async function actionRegisterPreferenceTags(data: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, message: 'Faça login para salvar preferências.' }
  }

  const formResult = registerPreferenceTagsSchema.safeParse({ tagIds: parseTagIds(data) })

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  for (const tagId of formResult.data.tagIds) {
    const [_, responseError] = await registerPreferenceTag({ userId: user.id, tagId })

    if (responseError && !isAlreadyRegisteredError(responseError.message)) {
      return {
        success: false,
        message: responseError.message ?? 'Não foi possível salvar as preferências.',
      }
    }
  }

  revalidatePreferenceTags()

  return { success: true, message: 'Preferências salvas.' }
}
