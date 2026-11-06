'use server'

import z from 'zod'
import { getCurrentUser } from '../auth/require-user'
import { getProject } from '../http/routes/projects/get-project'
import { registerProjectTag } from '../http/routes/projects/register-project-tag'
import { removeProjectTag } from '../http/routes/projects/remove-project-tag'
import { revalidateProjects } from '../revalidate-projects'

function parseTagIds(data: FormData): string[] {
  return data.getAll('tag-id').map(String).filter(Boolean)
}

const registerProjectTagsSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  tagIds: z.array(z.uuid()),
})

function isAlreadyRegisteredError(message?: string) {
  return Boolean(message?.toLowerCase().includes('já cadastrada'))
}

export async function actionRegisterProjectTags(data: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, message: 'Faça login para alterar as tags.' }
  }

  const formResult = registerProjectTagsSchema.safeParse({
    'project-id': data.get('project-id'),
    tagIds: parseTagIds(data),
  })

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const projectId = formResult.data['project-id']
  const { project } = await getProject(projectId)

  if (project.authorId !== user.id) {
    return { success: false, message: 'Você não é o autor deste projeto.' }
  }

  const currentTagIds = new Set(project.tags)
  const selectedTagIds = new Set(formResult.data.tagIds)
  const tagIdsToLink = [...selectedTagIds].filter((tagId) => !currentTagIds.has(tagId))
  const tagIdsToUnlink = [...currentTagIds].filter((tagId) => !selectedTagIds.has(tagId))

  if (tagIdsToLink.length === 0 && tagIdsToUnlink.length === 0) {
    return { success: true, message: 'Nenhuma alteração nas tags do projeto.' }
  }

  for (const tagId of tagIdsToLink) {
    const [_, responseError] = await registerProjectTag(projectId, tagId)

    if (responseError && !isAlreadyRegisteredError(responseError.message)) {
      return {
        success: false,
        message: responseError.message ?? 'Não foi possível vincular as tags.',
      }
    }
  }

  for (const tagId of tagIdsToUnlink) {
    const [_, responseError] = await removeProjectTag(projectId, tagId)

    if (responseError) {
      return {
        success: false,
        message: responseError.message ?? 'Não foi possível remover as tags.',
      }
    }
  }

  revalidateProjects(projectId)

  return { success: true, message: 'Tags do projeto atualizadas.' }
}
