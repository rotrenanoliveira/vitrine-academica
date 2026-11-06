import { EmailMessage } from '@/domain/mail/enterprise/value-objects/email-message'

interface CallApplicationDecisionParams {
  to: string
  name: string
  callTitle: string
  approved: boolean
}

export function callApplicationDecisionMail({ to, name, callTitle, approved }: CallApplicationDecisionParams) {
  const decision = approved ? 'foi aprovada' : 'não foi aprovada desta vez'

  return EmailMessage.create({
    to,
    subject: 'Atualização da sua candidatura - Vitrine Acadêmica',
    text: [`Olá ${name}!`, `Sua candidatura ao chamado "${callTitle}" ${decision}.`, '', '- Vitrine Acadêmica'].join(
      '\n',
    ),
  })
}
