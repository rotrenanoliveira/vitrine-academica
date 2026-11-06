export class AlreadyAppliedToCallError extends Error {
  constructor(message?: string) {
    super(message ?? 'Você já se candidatou a este chamado')
    this.name = 'AlreadyAppliedToCallError'
  }
}
