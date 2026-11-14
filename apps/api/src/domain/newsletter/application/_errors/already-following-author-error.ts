export class AlreadyFollowingAuthorError extends Error {
  constructor(message?: string) {
    super(message ?? 'Você já acompanha este autor')
    this.name = 'AlreadyFollowingAuthorError'
  }
}
