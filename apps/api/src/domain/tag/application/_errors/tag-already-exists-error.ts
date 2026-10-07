export class TagAlreadyExistsError extends Error {
  constructor(message?: string) {
    super(message ?? 'Tag já existe')
    this.name = 'TagAlreadyExistsError'
  }
}
