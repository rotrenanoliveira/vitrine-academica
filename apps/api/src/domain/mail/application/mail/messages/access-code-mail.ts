import { EmailMessage } from '@/domain/mail/enterprise/value-objects/email-message'

interface AccessCodeParams {
  to: string
  code: string
  expiresIn: number // minutos
}

export function accessCodeMail({ to, code, expiresIn }: AccessCodeParams) {
  return EmailMessage.create({
    to,
    subject: 'Seu código de acesso - Vitrine Acadêmica',
    text: [
      `Olá!`,
      `Seu código de acesso é: ${code}`,
      '',
      `Este código expire em ${expiresIn} minutos.`,
      'Se você não criou uma conta na Vitrine Acadêmica, ignore este e-mail.',
      ' - Vitrine Acadêmica',
    ].join('\n'),
  })
}
