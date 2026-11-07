export class EventNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Evento não encontrado')
    this.name = 'EventNotFoundError'
  }
}
