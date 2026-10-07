export class PreferenceTagAlreadyExistsError extends Error {
  constructor(message?: string) {
    super(message ?? 'Tag de preferência já cadastrada')
    this.name = 'PreferenceTagAlreadyExistsError'
  }
}
