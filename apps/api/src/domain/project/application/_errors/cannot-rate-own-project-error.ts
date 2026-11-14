export class CannotRateOwnProjectError extends Error {
  constructor(message?: string) {
    super(message ?? 'Não é permitido avaliar o próprio projeto')
    this.name = 'CannotRateOwnProjectError'
  }
}
