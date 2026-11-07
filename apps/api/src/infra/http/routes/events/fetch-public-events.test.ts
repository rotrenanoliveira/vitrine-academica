import { appForTest as app } from '@tests/app'
import { setupManagerWithEventCycle, setupOpenEventCycle } from '@tests/factories/setup-event'
import request from 'supertest'

describe('(E2E) - GET /api/v1/events', () => {
  it('should list events', async () => {
    const themeSelection = await setupManagerWithEventCycle({ participationScope: 'GLOBAL', name: 'Ciclo global' })
    const open = await setupOpenEventCycle({ participationScope: 'GLOBAL', name: 'Evento aberto' })
    await setupManagerWithEventCycle({ participationScope: 'INSTITUTION', name: 'Ciclo interno' })

    const response = await request(app.server).get('/api/v1/events')

    expect(response.status).toBe(200)
    expect(response.body.events).toHaveLength(2)
    expect(response.body.events.map((event: { id: string }) => event.id)).toEqual(
      expect.arrayContaining([themeSelection.event.id, open.event.id]),
    )
  })

  it('should filter public events by phase', async () => {
    await setupManagerWithEventCycle({ participationScope: 'GLOBAL' })
    const open = await setupOpenEventCycle({ participationScope: 'GLOBAL' })

    const response = await request(app.server).get('/api/v1/events').query({ phase: 'OPEN' })

    expect(response.status).toBe(200)
    expect(response.body.events).toHaveLength(1)
    expect(response.body.events[0].id).toBe(open.event.id)
    expect(response.body.events[0].phase).toBe('OPEN')
  })
})
