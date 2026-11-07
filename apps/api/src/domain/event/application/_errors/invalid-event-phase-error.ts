export class InvalidEventPhaseError extends Error {
  constructor(message?: string) {
    super(message ?? 'Fase do evento inválida para esta operação')
    this.name = 'InvalidEventPhaseError'
  }
}
