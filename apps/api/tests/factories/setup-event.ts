import { appForTest as app } from '@tests/app'
import { setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

type ParticipationScope = 'GLOBAL' | 'INSTITUTION'

export async function createEventCycle(params: {
  accessToken: string
  institutionId: string
  participationScope?: ParticipationScope
  name?: string | null
}) {
  const response = await request(app.server)
    .post(`/api/v1/institutions/${params.institutionId}/events`)
    .set('Authorization', `Bearer ${params.accessToken}`)
    .send({
      participationScope: params.participationScope ?? 'GLOBAL',
      name: params.name,
    })

  return response
}

type EventHttp = {
  id: string
  slug: string
  institutionId: string
  phase: string
  participationScope: string
  name: string | null
  winnerThemeId: string | null
}

function assertStatus(response: { status: number; body: unknown }, expected: number, step: string) {
  if (response.status !== expected) {
    throw new Error(`${step} expected ${expected}, got ${response.status}: ${JSON.stringify(response.body)}`)
  }
}

export async function setupManagerWithEventCycle(options?: {
  participationScope?: ParticipationScope
  name?: string | null
}) {
  const { accessToken, user, institution } = await setupManagerWithInstitution()
  const createResponse = await createEventCycle({
    accessToken,
    institutionId: institution.id.toString(),
    participationScope: options?.participationScope,
    name: options?.name,
  })

  assertStatus(createResponse, 201, 'createEventCycle')

  return {
    accessToken,
    user,
    institution,
    event: createResponse.body.event as EventHttp,
    createResponse,
  }
}

export async function suggestTheme(params: {
  accessToken: string
  eventId: string
  title?: string
  description?: string
}) {
  return request(app.server)
    .post(`/api/v1/events/${params.eventId}/themes`)
    .set('Authorization', `Bearer ${params.accessToken}`)
    .send({
      title: params.title ?? 'Tema sugerido',
      description: params.description ?? 'Descrição do tema sugerido',
    })
}

export async function moderateTheme(params: {
  accessToken: string
  themeId: string
  action: 'APPROVE' | 'REJECT' | 'HIDE'
  reason?: string | null
}) {
  return request(app.server)
    .patch(`/api/v1/events/themes/${params.themeId}/moderation`)
    .set('Authorization', `Bearer ${params.accessToken}`)
    .send({
      action: params.action,
      reason: params.reason,
    })
}

export async function selectInstitutionalTheme(params: { accessToken: string; eventId: string; themeId: string }) {
  return request(app.server)
    .post(`/api/v1/events/${params.eventId}/select-theme`)
    .set('Authorization', `Bearer ${params.accessToken}`)
    .send({ themeId: params.themeId })
}

export async function setupOpenEventCycle(options?: {
  participationScope?: ParticipationScope
  name?: string | null
  themeTitle?: string
}) {
  const setup = await setupManagerWithEventCycle({
    participationScope: options?.participationScope,
    name: options?.name,
  })

  const themeResponse = await suggestTheme({
    accessToken: setup.accessToken,
    eventId: setup.event.id,
    title: options?.themeTitle,
  })
  assertStatus(themeResponse, 201, 'suggestTheme')

  const theme = themeResponse.body.theme as { id: string; title: string; status: string }

  const moderateResponse = await moderateTheme({
    accessToken: setup.accessToken,
    themeId: theme.id,
    action: 'APPROVE',
  })
  assertStatus(moderateResponse, 200, 'moderateTheme')

  const selectResponse = await selectInstitutionalTheme({
    accessToken: setup.accessToken,
    eventId: setup.event.id,
    themeId: theme.id,
  })
  assertStatus(selectResponse, 200, 'selectInstitutionalTheme')

  return {
    ...setup,
    theme,
    event: selectResponse.body.event as EventHttp,
    selectResponse,
  }
}
