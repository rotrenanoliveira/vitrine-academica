export class NotEventProjectOwnerError extends Error {
  constructor(message?: string) {
    super(message ?? 'Somente o autor do projeto pode inscrevê-lo no evento')
    this.name = 'NotEventProjectOwnerError'
  }
}
