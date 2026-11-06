export class InvalidCallDeadlineError extends Error {
  constructor(message?: string) {
    super(message ?? 'O prazo do chamado deve ser uma data futura')
    this.name = 'InvalidCallDeadlineError'
  }
}
