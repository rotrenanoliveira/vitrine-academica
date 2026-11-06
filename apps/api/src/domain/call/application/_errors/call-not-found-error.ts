export class CallNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Chamado não encontrado')
    this.name = 'CallNotFoundError'
  }
}
