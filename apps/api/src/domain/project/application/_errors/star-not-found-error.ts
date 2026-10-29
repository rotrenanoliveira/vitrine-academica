export class StarNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Estrela não encontrada')
    this.name = 'StarNotFoundError'
  }
}
