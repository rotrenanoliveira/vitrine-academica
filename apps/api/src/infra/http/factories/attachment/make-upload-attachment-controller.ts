import { UploadAttachmentUseCase } from '@/domain/storage/application/use-cases/upload-attachment'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { makeStorage } from '@/infra/storage/make-storage'
import { UploadAttachmentController } from '../../controllers/attachment/upload-attachment.controller'

export function makeUploadAttachmentController() {
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const storage = makeStorage()
  const uploadAttachmentUseCase = new UploadAttachmentUseCase(attachmentsRepository, storage)

  return new UploadAttachmentController(uploadAttachmentUseCase)
}
