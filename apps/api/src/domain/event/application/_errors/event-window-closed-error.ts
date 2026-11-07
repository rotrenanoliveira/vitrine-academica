export class EventWindowClosedError extends Error {
  constructor(message?: string) {
    super(message ?? 'A janela desta ação no evento já foi encerrada')
    this.name = 'EventWindowClosedError'
  }
}
