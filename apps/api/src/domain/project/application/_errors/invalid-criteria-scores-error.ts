export class InvalidCriteriaScoresError extends Error {
  constructor(message?: string) {
    super(message ?? 'As notas dos critérios são inválidas')
    this.name = 'InvalidCriteriaScoresError'
  }
}
