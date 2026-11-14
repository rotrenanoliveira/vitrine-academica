export class CannotFollowYourselfError extends Error {
  constructor(message?: string) {
    super(message ?? 'Você não pode acompanhar a si mesmo')
    this.name = 'CannotFollowYourselfError'
  }
}
