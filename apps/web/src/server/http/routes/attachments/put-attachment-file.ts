'use server'

type PutAttachmentFileParams = {
  uploadUrl: string
  file: File
  mimeType: string
  size: number
}

export async function putAttachmentFile({ uploadUrl, file, mimeType, size }: PutAttachmentFileParams) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(size),
    },
    body: Buffer.from(await file.arrayBuffer()),
  })

  if (!response.ok) {
    return {
      success: false as const,
      message: 'Não foi possível enviar o arquivo para o armazenamento.',
    }
  }

  return { success: true as const }
}
