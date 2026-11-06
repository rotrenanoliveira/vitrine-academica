export class CannotInviteProjectOwnerError extends Error {
  constructor(message?: string) {
    super(message ?? 'O dono do projeto não pode ser convidado como membro')
    this.name = 'CannotInviteProjectOwnerError'
  }
}
