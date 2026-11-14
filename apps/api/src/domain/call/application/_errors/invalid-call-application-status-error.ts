export class InvalidCallApplicationStatusError extends Error {
  constructor(message?: string) {
    super(message ?? 'Status da candidatura inválido para esta operação')
    this.name = 'InvalidCallApplicationStatusError'
  }
}
