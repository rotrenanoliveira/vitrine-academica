export class AccessCodeAlreadyConsumedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Código de acesso já utilizado')
    this.name = 'AccessCodeAlreadyConsumedError'
  }
}
