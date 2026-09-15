export class ProjectAlreadyScheduledError extends Error {
  constructor(message?: string) {
    super(message ?? 'Projeto já está agendado')
    this.name = 'ProjectAlreadyScheduledError'
  }
}
