import { appForTest as app } from '@tests/app'
import { setupOpenEventCycle } from '@tests/factories/setup-event'
import request from 'supertest'

describe('(E2E) - GET /api/v1/events/:eventIdOrSlug', () => {
  it('should get a publicly listed event by id', async () => {
    const { event } = await setupOpenEventCycle({ name: 'Evento público' })

    const response = await request(app.server).get(`/api/v1/events/${event.id}`)

    expect(response.status).toBe(200)
    expect(response.body.event.id).toBe(event.id)
    expect(response.body.event.phase).toBe('OPEN')
    expect(response.body.event.name).toBe('Evento público')
  })

  it('should get a publicly listed event by slug', async () => {
    const { event } = await setupOpenEventCycle({ name: 'Evento por slug' })

    const response = await request(app.server).get(`/api/v1/events/${event.slug}`)

    expect(response.status).toBe(200)
    expect(response.body.event.id).toBe(event.id)
    expect(response.body.event.slug).toBe(event.slug)
  })

  it('should not get a non-existent event', async () => {
    const response = await request(app.server).get('/api/v1/events/00000000-0000-4000-8000-000000000000')

    expect(response.status).toBe(404)
  })
})
