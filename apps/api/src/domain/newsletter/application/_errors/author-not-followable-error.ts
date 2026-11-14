export class AuthorNotFollowableError extends Error {
  constructor(message?: string) {
    super(message ?? 'Este autor ainda não tem projetos publicados')
    this.name = 'AuthorNotFollowableError'
  }
}
