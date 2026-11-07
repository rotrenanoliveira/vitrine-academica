export class InvalidEventCalendarError extends Error {
  constructor(message?: string) {
    super(message ?? 'Calendário do evento inválido')
    this.name = 'InvalidEventCalendarError'
  }
}
