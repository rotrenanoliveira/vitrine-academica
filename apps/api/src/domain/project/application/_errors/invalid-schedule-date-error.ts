export class InvalidScheduleDateError extends Error {
  constructor(message?: string) {
    super(message ?? 'A data de publicação deve estar no futuro')
    this.name = 'InvalidScheduleDateError'
  }
}
