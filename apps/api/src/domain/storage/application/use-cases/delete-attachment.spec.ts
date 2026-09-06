import { makeAttachment } from '@tests/factories/make-attachment'
import { InMemoryAttachmentsRepository } from '@tests/repositories/in-memory-attachments-repository'
import { InMemoryStorage } from '@tests/repositories/in-memory-storage'
import { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentNotFoundError } from '../_errors/attachment-not-found-error'
import { DeleteAttachmentUseCase } from './delete-attachment'

let attachmentsRepository: InMemoryAttachmentsRepository
let storage: InMemoryStorage
let sut: DeleteAttachmentUseCase

describe('(UC) - Delete Attachment', () => {
  beforeEach(() => {
    attachmentsRepository = new InMemoryAttachmentsRepository()
    storage = new InMemoryStorage()
    sut = new DeleteAttachmentUseCase(attachmentsRepository, storage)
  })

  it('should be able to delete attachment by id', async () => {
    const attachmentStorageKey = Attachment.generateStorageKey('item.png', 'profiles')
    const { attachment } = makeAttachment({ storageKey: attachmentStorageKey })

    await attachmentsRepository.create(attachment)

    const result = await sut.execute({
      attachmentId: attachment.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(attachmentsRepository.items).toHaveLength(0)
    expect(storage.keys).toEqual([attachmentStorageKey])
  })

  it('should not be able to delete a non-existing attachment', async () => {
    const result = await sut.execute({ attachmentId: 'non-existing-id' })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AttachmentNotFoundError)
    }
  })
})
