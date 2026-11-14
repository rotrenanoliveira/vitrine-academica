export class CallApplicationNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Candidatura não encontrada')
    this.name = 'CallApplicationNotFoundError'
  }
}
