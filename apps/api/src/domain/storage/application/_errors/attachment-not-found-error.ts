export class AttachmentNotFoundError extends Error {
  constructor() {
    super('Arquivo não encontrado.')
  }
}
