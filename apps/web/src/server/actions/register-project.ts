'use server'

import z from 'zod'
import { putAttachmentFile } from '../http/routes/attachments/put-attachment-file'
import { uploadAttachment } from '../http/routes/attachments/upload-attachment'
import { registerProject } from '../http/routes/projects/register-project'
import { revalidateProjects } from '../revalidate-projects'

const MAX_COVER_SIZE = 5 * 1024 * 1024
const ALLOWED_COVER_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg']
const COVER_ATTACHMENT_FOLDER = 'projects'

const registerProjectSchema = z.object({
  title: z.string().min(1, 'Informe o título.').max(200),
  description: z.string().min(1, 'Informe a descrição.'),
})

function getCoverFile(data: FormData): File | null {
  const value = data.get('cover-attachment')

  if (!(value instanceof File) || value.size === 0) {
    return null
  }

  return value
}

export async function actionRegisterProject(data: FormData) {
  const coverFile = getCoverFile(data)

  if (!coverFile) {
    return { success: false, message: 'Informe a imagem de capa.' }
  }

  if (coverFile.size > MAX_COVER_SIZE) {
    return { success: false, message: 'A capa deve ter no máximo 5 MB.' }
  }

  if (!ALLOWED_COVER_MIME_TYPES.includes(coverFile.type)) {
    return { success: false, message: 'Tipo de arquivo não permitido. Use PNG ou JPG.' }
  }

  const formResult = registerProjectSchema.safeParse({
    title: data.get('title'),
    description: data.get('description'),
  })

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const [uploadResult, uploadError] = await uploadAttachment({
    name: coverFile.name,
    mimeType: coverFile.type,
    size: coverFile.size,
    attachmentFolder: COVER_ATTACHMENT_FOLDER,
  })

  if (uploadError || !uploadResult) {
    return {
      success: false,
      message: uploadError?.message ?? 'Não foi possível preparar o envio da capa.',
    }
  }

  const putResult = await putAttachmentFile({
    uploadUrl: uploadResult.uploadUrl,
    file: coverFile,
    mimeType: coverFile.type,
    size: coverFile.size,
  })

  if (!putResult.success) {
    return {
      success: false,
      message: putResult.message,
    }
  }

  const [_, responseError] = await registerProject({
    title: formResult.data.title,
    description: formResult.data.description,
    attachments: [uploadResult.attachment.id],
  })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível criar o projeto.' }
  }

  revalidateProjects()

  return { success: true, message: 'Projeto criado como rascunho.' }
}
