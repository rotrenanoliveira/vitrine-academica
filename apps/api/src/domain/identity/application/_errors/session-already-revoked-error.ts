export class SessionAlreadyRevokedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Sessão já revogada')
    this.name = 'SessionAlreadyRevokedError'
  }
}
