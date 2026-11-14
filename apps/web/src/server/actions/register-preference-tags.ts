'use server'

import z from 'zod'
import { getCurrentUser } from '../auth/require-user'
import { deactivatePreferenceTag } from '../http/routes/preference-tags/deactivate-preference-tag'
import { fetchUserPreferenceTags } from '../http/routes/preference-tags/fetch-user-preference-tags'
import { registerPreferenceTag } from '../http/routes/preference-tags/register-preference-tag'
import { revalidatePreferenceTags } from '../revalidate-preference-tags'

function parseTagIds(data: FormData): string[] {
  return data.getAll('tag-id').map(String).filter(Boolean)
}

const preferenceTagsSchema = z.object({
  tagIds: z.array(z.uuid()),
})

function isAlreadyRegisteredError(message?: string) {
  return Boolean(message?.toLowerCase().includes('já cadastrada'))
}

export async function actionRegisterPreferenceTags(data: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, message: 'Faça login para salvar preferências.' }
  }

  const formResult = preferenceTagsSchema.safeParse({ tagIds: parseTagIds(data) })

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  let activeTagIds: Set<string>

  try {
    const { preferenceTags } = await fetchUserPreferenceTags(user.id)

    activeTagIds = new Set(
      preferenceTags.filter((preference) => preference.status === 'ACTIVE').map((preference) => preference.tagId),
    )
  } catch {
    return { success: false, message: 'Não foi possível carregar as preferências atuais.' }
  }

  const selectedTagIds = new Set(formResult.data.tagIds)
  const tagIdsToActivate = [...selectedTagIds].filter((tagId) => !activeTagIds.has(tagId))
  const tagIdsToDeactivate = [...activeTagIds].filter((tagId) => !selectedTagIds.has(tagId))

  if (tagIdsToActivate.length === 0 && tagIdsToDeactivate.length === 0) {
    return { success: true, message: 'Nenhuma alteração nas preferências.' }
  }

  for (const tagId of tagIdsToActivate) {
    const [_, responseError] = await registerPreferenceTag({ userId: user.id, tagId })

    if (responseError && !isAlreadyRegisteredError(responseError.message)) {
      return {
        success: false,
        message: responseError.message ?? 'Não foi possível salvar as preferências.',
      }
    }
  }

  for (const tagId of tagIdsToDeactivate) {
    const [_, responseError] = await deactivatePreferenceTag(tagId)

    if (responseError) {
      return {
        success: false,
        message: responseError.message ?? 'Não foi possível remover as preferências.',
      }
    }
  }

  revalidatePreferenceTags()

  return { success: true, message: 'Preferências salvas.' }
}
