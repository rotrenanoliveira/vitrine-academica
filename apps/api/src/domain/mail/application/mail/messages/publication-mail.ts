import { EmailMessage } from '@/domain/mail/enterprise/value-objects/email-message'

interface PublicationMailParams {
  to: string
  authorName: string
  projectTitle: string
  projectUrl: string
  unsubscribeUrl: string
}

export function publicationMail({ to, authorName, projectTitle, projectUrl, unsubscribeUrl }: PublicationMailParams) {
  return EmailMessage.create({
    to,
    subject: `${authorName} publicou um novo projeto na Vitrine Acadêmica`,
    text: [
      'Olá!',
      '',
      `${authorName}, que você acompanha, acabou de publicar o projeto "${projectTitle}".`,
      `Veja o projeto: ${projectUrl}`,
      '',
      'Você recebeu este e-mail porque acompanha este autor.',
      `Para deixar de receber, cancele aqui: ${unsubscribeUrl}`,
    ].join('\n'),
  })
}
