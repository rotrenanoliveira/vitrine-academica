import { EmailMessage } from '@/domain/mail/enterprise/value-objects/email-message'

interface EmailConfirmationParams {
  to: string
  name: string
  confirmationUrl: string
}

export function emailConfirmationMail({ to, name, confirmationUrl }: EmailConfirmationParams) {
  return EmailMessage.create({
    to,
    subject: 'Confirme seu e-mail - Vitrine Acadêmica',
    text: [
      `Olá ${name}`,
      'Confirme seu e-mail acessando o link abaixo:',
      confirmationUrl,
      '',
      'Se você não criou uma conta na Vitrine Acadêmica, ignore este e-mail.',
      ' - Vitrine Acadêmica',
    ].join('\n'),
  })
}
