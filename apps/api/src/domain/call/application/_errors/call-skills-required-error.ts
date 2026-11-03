export class CallSkillsRequiredError extends Error {
  constructor(message?: string) {
    super(message ?? 'Informe ao menos uma habilidade para o chamado')
    this.name = 'CallSkillsRequiredError'
  }
}
