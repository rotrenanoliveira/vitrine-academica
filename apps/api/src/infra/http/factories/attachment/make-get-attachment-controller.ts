import { GetAttachmentUseCase } from '@/domain/storage/application/use-cases/get-attachment'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { GetAttachmentController } from '../../controllers/attachment/get-attachment.controller'

export function makeGetAttachmentController() {
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const getAttachmentUseCase = new GetAttachmentUseCase(attachmentsRepository)

  return new GetAttachmentController(getAttachmentUseCase)
}
