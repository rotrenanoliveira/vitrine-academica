import { makeAttachment } from '@tests/factories/make-attachment'
import { InMemoryAttachmentsRepository } from '@tests/repositories/in-memory-attachments-repository'
import { env } from '@/environment-variables'
import { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentNotFoundError } from '../_errors/attachment-not-found-error'
import { GetAttachmentUseCase } from './get-attachment'

let attachmentsRepository: InMemoryAttachmentsRepository
let sut: GetAttachmentUseCase

describe('(UC) - Get Attachment', () => {
  beforeEach(() => {
    attachmentsRepository = new InMemoryAttachmentsRepository()
    sut = new GetAttachmentUseCase(attachmentsRepository)
  })

  it('should be able to get attachment by id', async () => {
    const attachmentStorageKey = Attachment.generateStorageKey('item.png', 'profiles')
    const { attachment } = makeAttachment({ storageKey: attachmentStorageKey })

    await attachmentsRepository.create(attachment)

    const result = await sut.execute({
      attachmentId: attachment.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.attachment.id).toBe(attachment.id)
      expect(result.value.attachment.storageKey).toBe(attachmentStorageKey)
      expect(result.value.attachmentUrl).toBe(`${env.CLOUDFLARE_R2_ASSETS_URL}/${attachmentStorageKey}`)
    }
  })

  it('should not be able to get a non-existing attachment', async () => {
    const result = await sut.execute({ attachmentId: 'non-existing-id' })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AttachmentNotFoundError)
    }
  })
})
