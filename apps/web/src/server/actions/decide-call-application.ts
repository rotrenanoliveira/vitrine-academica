'use server'

import z from 'zod'
import { decideCallApplication } from '../http/routes/calls/decide-call-application'
import { revalidateCalls } from '../revalidate-calls'

const decideCallApplicationSchema = z.object({
  callId: z.uuid('Chamado inválido.'),
  applicationId: z.uuid('Candidatura inválida.'),
  decision: z.enum(['APPROVED', 'REJECTED']),
})

export async function actionDecideCallApplication(input: {
  callId: string
  applicationId: string
  decision: 'APPROVED' | 'REJECTED'
}) {
  const formResult = decideCallApplicationSchema.safeParse(input)

  if (formResult.success === false) {
    return {
      success: false,
      message: z.prettifyError(formResult.error).replace('✖ ', '').split('\n')[0],
    }
  }

  const { callId, applicationId, decision } = formResult.data

  const [response, responseError] = await decideCallApplication({ callId, applicationId, decision })

  if (responseError) {
    return { success: false, message: responseError.message ?? 'Não foi possível registrar a decisão.' }
  }

  revalidateCalls(callId)

  const decisionLabel = decision === 'APPROVED' ? 'aprovada' : 'rejeitada'

  if (response?.notified === false) {
    return {
      success: true,
      message: `Candidatura ${decisionLabel}, mas não foi possível avisar o candidato por e-mail.`,
      notified: false,
    }
  }

  return { success: true, message: `Candidatura ${decisionLabel}. O candidato foi avisado por e-mail.`, notified: true }
}
