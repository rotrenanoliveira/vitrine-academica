import { InMemoryAttachmentsRepository } from '@tests/repositories/in-memory-attachments-repository'
import { InMemoryStorage } from '@tests/repositories/in-memory-storage'
import { InvalidAttachmentError } from '../_errors/invalid-attachment-error'
import { UploadAttachmentUseCase } from './upload-attachment'

let attachmentsRepository: InMemoryAttachmentsRepository
let storage: InMemoryStorage
let sut: UploadAttachmentUseCase

describe('(UC) - Upload Storage', () => {
  beforeEach(() => {
    attachmentsRepository = new InMemoryAttachmentsRepository()
    storage = new InMemoryStorage()
    sut = new UploadAttachmentUseCase(attachmentsRepository, storage)
  })

  it('should be able to save an attachment and return the signed url', async () => {
    const result = await sut.execute({
      name: 'imagem perfil.png',
      mimeType: 'image/png',
      size: 1024,
      attachmentFolder: 'profile',
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.attachment.name).toBe('imagem perfil.png')
      expect(result.value.attachment.storageKey).toMatch(/^profile\/.+-imagem-perfil\.?png$/)
      expect(attachmentsRepository.items).toHaveLength(1)
      expect(storage.items).toHaveLength(1)
    }
  })

  it('should be able to normalize attachment name', async () => {
    const result = await sut.execute({
      name: 'Minha imagem de perfil de coração (1).png',
      mimeType: 'image/png',
      size: 1024,
      attachmentFolder: 'profile',
    })

    assert(result.isRight())

    expect(result.value.attachment.storageKey).toMatch(/^profile\/.+-minha-imagem-de-perfil-de-coracao-1\.?png$/)
  })

  it('should not be able to save an attachment with invalid size', async () => {
    const result = await sut.execute({
      name: 'profile.png',
      mimeType: 'image/png',
      size: 0,
      attachmentFolder: 'profile',
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttachmentError)
    }

    expect(attachmentsRepository.items).toHaveLength(0)
    expect(storage.items).toHaveLength(0)
  })

  it('should not be able to save an attachment with size higher than allowed', async () => {
    const result = await sut.execute({
      name: 'profile.png',
      mimeType: 'image/png',
      size: 6 * 1024 * 1024, // 6MB
      attachmentFolder: 'profile',
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttachmentError)
    }

    expect(attachmentsRepository.items).toHaveLength(0)
    expect(storage.items).toHaveLength(0)
  })

  it('should not be able to save an attachment with type not allowed', async () => {
    const result = await sut.execute({
      name: 'profile.gif',
      mimeType: 'image/gif',
      size: 1024,
      attachmentFolder: 'profile',
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttachmentError)
    }

    expect(attachmentsRepository.items).toHaveLength(0)
    expect(storage.items).toHaveLength(0)
  })
})
