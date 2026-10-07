import { DeleteAttachmentUseCase } from '@/domain/storage/application/use-cases/delete-attachment'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { makeStorage } from '@/infra/storage/make-storage'
import { DeleteAttachmentController } from '../../controllers/attachment/delete-attachment.controller'

export function makeDeleteAttachmentController() {
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const storage = makeStorage()
  const deleteAttachmentUseCase = new DeleteAttachmentUseCase(attachmentsRepository, storage)

  return new DeleteAttachmentController(deleteAttachmentUseCase)
}
