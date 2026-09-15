'use server'

import z from 'zod'
import { institutionMemberRoleSchema } from '@/utils/type'
import { putAttachmentFile } from '../http/routes/attachments/put-attachment-file'
import { uploadAttachment } from '../http/routes/attachments/upload-attachment'
import { requestInstitutionMembership } from '../http/routes/institutions/request-institution-membership'
import { revalidateInstitutionMembershipRequests } from '../revalidate-institution-membership-requests'

const MAX_PROOF_SIZE = 5 * 1024 * 1024
const ALLOWED_PROOF_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf']
const PROOF_ATTACHMENT_FOLDER = 'institution-memberships'

const requestInstitutionMembershipSchema = z.object({
  'institution-id': z.uuid('Instituição inválida.'),
  'institution-slug': z.string().min(1, 'Slug inválido.'),
  role: institutionMemberRoleSchema,
})

function getProofFile(data: FormData): File | null {
  const value = data.get('proof-attachment')

  if (!(value instanceof File) || value.size === 0) {
    return null
  }

  return value
}

export async function actionRequestInstitutionMembership(data: FormData) {
  const proofFile = getProofFile(data)

  const formResult = requestInstitutionMembershipSchema.safeParse({
    'institution-id': data.get('institution-id'),
    'institution-slug': data.get('institution-slug'),
    role: data.get('role'),
  })

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  let proofAttachmentId: string | undefined

  if (proofFile) {
    if (proofFile.size > MAX_PROOF_SIZE) {
      return {
        success: false,
        message: 'O comprovante deve ter no máximo 5 MB.',
      }
    }

    if (!ALLOWED_PROOF_MIME_TYPES.includes(proofFile.type)) {
      return {
        success: false,
        message: 'Tipo de arquivo não permitido. Use PNG, JPG ou PDF.',
      }
    }

    const [uploadResult, uploadError] = await uploadAttachment({
      name: proofFile.name,
      mimeType: proofFile.type,
      size: proofFile.size,
      attachmentFolder: PROOF_ATTACHMENT_FOLDER,
    })

    if (uploadError || !uploadResult) {
      return {
        success: false,
        message: uploadError?.message ?? 'Não foi possível preparar o envio do comprovante.',
      }
    }

    const putResult = await putAttachmentFile({
      uploadUrl: uploadResult.uploadUrl,
      file: proofFile,
      mimeType: proofFile.type,
      size: proofFile.size,
    })

    if (!putResult.success) {
      return {
        success: false,
        message: putResult.message,
      }
    }

    proofAttachmentId = uploadResult.attachment.id
  }

  const institutionId = formResult.data['institution-id']
  const slug = formResult.data['institution-slug']
  const [_, responseError] = await requestInstitutionMembership({
    institutionId,
    role: formResult.data.role,
    proofAttachmentId,
  })

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível enviar a solicitação.',
    }
  }

  revalidateInstitutionMembershipRequests(slug)

  return { success: true, message: 'Solicitação enviada.' }
}
