export class ExpiredAccessCodeError extends Error {
  constructor(message?: string) {
    super(message ?? 'Código de acesso expirado')
    this.name = 'ExpiredAccessCodeError'
  }
}
