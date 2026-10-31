export class CriterionNotActiveError extends Error {
  constructor(message?: string) {
    super(message ?? 'Um ou mais critérios não estão ativos')
    this.name = 'CriterionNotActiveError'
  }
}
