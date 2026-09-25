export class ExternalServiceError extends Error {
  constructor(reason?: string) {
    super(reason ?? 'Serviço externo indisponível')
    this.name = 'ExternalServiceError'
  }
}
