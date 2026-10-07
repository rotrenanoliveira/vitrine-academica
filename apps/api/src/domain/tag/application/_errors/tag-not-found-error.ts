export class TagNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Tag não encontrada')
    this.name = 'TagNotFoundError'
  }
}
