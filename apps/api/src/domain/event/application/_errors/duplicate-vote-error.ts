export class DuplicateVoteError extends Error {
  constructor(message?: string) {
    super(message ?? 'O usuário já votou neste evento')
    this.name = 'DuplicateVoteError'
  }
}
