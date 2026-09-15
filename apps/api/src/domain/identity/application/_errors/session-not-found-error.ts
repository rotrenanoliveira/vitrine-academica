export class SessionNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Sessão não encontrada')
    this.name = 'SessionNotFoundError'
  }
}
