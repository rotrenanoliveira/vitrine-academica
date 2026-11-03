export class InvalidCallStatusError extends Error {
  constructor(message?: string) {
    super(message ?? 'Status do chamado inválido para esta operação')
    this.name = 'InvalidCallStatusError'
  }
}
