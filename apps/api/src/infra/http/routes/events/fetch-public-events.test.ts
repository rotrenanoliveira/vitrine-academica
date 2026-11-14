import { appForTest as app } from '@tests/app'
import { setupManagerWithEventCycle, setupOpenEventCycle } from '@tests/factories/setup-event'
import request from 'supertest'

describe('(E2E) - GET /api/v1/events', () => {
  it('should list events', async () => {
    const themeSelection = await setupManagerWithEventCycle({ participationScope: 'GLOBAL', name: 'Ciclo global' })
    const open = await setupOpenEventCycle({
      participationScope: 'GLOBAL',
      name: 'Evento aberto',
      themeTitle: 'Tema aberto',
    })
    await setupManagerWithEventCycle({ participationScope: 'INSTITUTION', name: 'Ciclo interno' })

    const response = await request(app.server).get('/api/v1/events')

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(2)
    expect(response.body.page).toBe(1)
    expect(response.body.perPage).toBe(30)
    expect(response.body.events).toHaveLength(2)
    expect(response.body.events.map((event: { id: string }) => event.id)).toEqual(
      expect.arrayContaining([themeSelection.event.id, open.event.id]),
    )

    const openItem = response.body.events.find((event: { id: string }) => event.id === open.event.id)
    const preparingItem = response.body.events.find((event: { id: string }) => event.id === themeSelection.event.id)

    expect(openItem).toMatchObject({
      id: open.event.id,
      institutionId: open.event.institutionId,
      institutionName: open.institution.name,
      slug: open.event.slug,
      name: 'Evento aberto',
      participationScope: 'GLOBAL',
      phase: 'OPEN',
      winner: 'Tema aberto',
    })
    expect(openItem).not.toHaveProperty('winnerThemeId')
    expect(openItem).not.toHaveProperty('startsAt')
    expect(preparingItem.winner).toBeNull()
    expect(preparingItem.institutionName).toBe(themeSelection.institution.name)
  })

  it('should filter public events by phase', async () => {
    await setupManagerWithEventCycle({ participationScope: 'GLOBAL' })
    const open = await setupOpenEventCycle({ participationScope: 'GLOBAL' })

    const response = await request(app.server).get('/api/v1/events').query({ phase: 'OPEN' })

    expect(response.status).toBe(200)
    expect(response.body.events).toHaveLength(1)
    expect(response.body.total).toBe(1)
    expect(response.body.events[0].id).toBe(open.event.id)
    expect(response.body.events[0].phase).toBe('OPEN')
  })

  it('should filter public events by participation scope', async () => {
    const globalOpen = await setupOpenEventCycle({ participationScope: 'GLOBAL', name: 'Global aberto' })
    await setupOpenEventCycle({ participationScope: 'INSTITUTION', name: 'Institucional aberto' })

    const response = await request(app.server).get('/api/v1/events').query({ participationScope: 'GLOBAL' })

    expect(response.status).toBe(200)
    expect(response.body.events.some((event: { id: string }) => event.id === globalOpen.event.id)).toBe(true)
    expect(
      response.body.events.every((event: { participationScope: string }) => event.participationScope === 'GLOBAL'),
    ).toBe(true)
  })

  it('should filter by multiple institution ids and phases', async () => {
    const first = await setupManagerWithEventCycle({ participationScope: 'INSTITUTION', name: 'Interno A' })
    const second = await setupManagerWithEventCycle({ participationScope: 'INSTITUTION', name: 'Interno B' })
    await setupManagerWithEventCycle({ participationScope: 'GLOBAL', name: 'Global prep' })

    const response = await request(app.server)
      .get('/api/v1/events')
      .query({
        phase: ['THEME_SELECTION', 'INSTITUTIONAL_SELECTION'],
        institutionIds: [first.institution.id.toString(), second.institution.id.toString()],
      })

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(2)
    expect(response.body.events).toHaveLength(2)
    expect(response.body.events.map((event: { id: string }) => event.id)).toEqual(
      expect.arrayContaining([first.event.id, second.event.id]),
    )
  })
})
