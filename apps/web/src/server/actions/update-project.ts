'use server'

import z from 'zod'
import { projectStatusSchema } from '@/utils/type'
import { putAttachmentFile } from '../http/routes/attachments/put-attachment-file'
import { uploadAttachment } from '../http/routes/attachments/upload-attachment'
import { updateProject } from '../http/routes/projects/update-project'
import { revalidateProjects } from '../revalidate-projects'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_PROJECT_IMAGES = 4
const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg']
const ATTACHMENT_FOLDER = 'projects'

const updateProjectSchema = z.object({
  'project-id': z.uuid('Projeto inválido.'),
  'project-slug': z.string().min(1, 'Slug inválido.'),
  title: z.string().min(1, 'Informe o título.').max(200),
  description: z.string().min(1, 'Informe a descrição.'),
  status: projectStatusSchema,
})

function getCoverFile(data: FormData): File | null {
  const value = data.get('cover-attachment')

  if (!(value instanceof File) || value.size === 0) {
    return null
  }

  return value
}

function getProjectImageFiles(data: FormData): File[] {
  return data.getAll('project-attachments').filter((value): value is File => value instanceof File && value.size > 0)
}

function getKeptAttachmentIds(data: FormData): string[] {
  return data
    .getAll('kept-attachment-id')
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
}

function validateImageFile(file: File, label: string): string | null {
  if (file.size > MAX_IMAGE_SIZE) {
    return `${label} deve ter no máximo 5 MB.`
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return `Tipo de arquivo não permitido em ${label.toLowerCase()}. Use PNG ou JPG.`
  }

  return null
}

async function uploadImageFile(file: File): Promise<{ id: string } | { error: string }> {
  const [uploadResult, uploadError] = await uploadAttachment({
    name: file.name,
    mimeType: file.type,
    size: file.size,
    attachmentFolder: ATTACHMENT_FOLDER,
  })

  if (uploadError || !uploadResult) {
    return { error: uploadError?.message ?? 'Não foi possível preparar o envio da imagem.' }
  }

  const putResult = await putAttachmentFile({
    uploadUrl: uploadResult.uploadUrl,
    file,
    mimeType: file.type,
    size: file.size,
  })

  if (!putResult.success) {
    return { error: putResult.message }
  }

  return { id: uploadResult.attachment.id }
}

export async function actionUpdateProject(data: FormData) {
  const coverFile = getCoverFile(data)
  const projectImageFiles = getProjectImageFiles(data)
  const keptAttachmentIds = getKeptAttachmentIds(data)
  const attachmentsManaged = data.get('attachments-managed') === '1'

  if (coverFile) {
    const coverError = validateImageFile(coverFile, 'A capa')
    if (coverError) {
      return { success: false, message: coverError }
    }
  }

  if (keptAttachmentIds.length + projectImageFiles.length > MAX_PROJECT_IMAGES) {
    return { success: false, message: 'O projeto pode ter no máximo 4 imagens.' }
  }

  for (const [index, file] of projectImageFiles.entries()) {
    const imageError = validateImageFile(file, `A imagem ${index + 1}`)
    if (imageError) {
      return { success: false, message: imageError }
    }
  }

  const formResult = updateProjectSchema.safeParse(Object.fromEntries(data))

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  let coverUrl: string | undefined

  if (coverFile) {
    const upload = await uploadImageFile(coverFile)
    if ('error' in upload) {
      return { success: false, message: upload.error }
    }
    coverUrl = upload.id
  }

  let attachments: string[] | undefined

  if (attachmentsManaged) {
    const uploadedIds: string[] = []

    for (const file of projectImageFiles) {
      const upload = await uploadImageFile(file)
      if ('error' in upload) {
        return { success: false, message: upload.error }
      }
      uploadedIds.push(upload.id)
    }

    attachments = [...keptAttachmentIds, ...uploadedIds]
  }

  const id = formResult.data['project-id']
  const slug = formResult.data['project-slug']
  const [_, responseError] = await updateProject({
    id,
    title: formResult.data.title,
    description: formResult.data.description,
    status: formResult.data.status,
    ...(coverUrl !== undefined ? { coverUrl } : {}),
    ...(attachments !== undefined ? { attachments } : {}),
  })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível atualizar o projeto.' }
  }

  revalidateProjects(slug)

  return { success: true, message: 'Projeto atualizado.' }
}
