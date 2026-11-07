export class InvalidRegistrationStatusError extends Error {
  constructor(message?: string) {
    super(message ?? 'Status da inscrição inválido para esta operação')
    this.name = 'InvalidRegistrationStatusError'
  }
}
