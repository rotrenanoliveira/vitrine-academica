export class CallNotAcceptingApplicationsError extends Error {
  constructor(message?: string) {
    super(message ?? 'O chamado não está recebendo candidaturas')
    this.name = 'CallNotAcceptingApplicationsError'
  }
}
