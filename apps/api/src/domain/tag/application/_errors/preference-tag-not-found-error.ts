export class PreferenceTagNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Tag de preferência não encontrada')
    this.name = 'PreferenceTagNotFoundError'
  }
}
