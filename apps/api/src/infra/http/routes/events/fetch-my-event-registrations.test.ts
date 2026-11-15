import { appForTest as app } from '@tests/app'
import { makeEventRegistrationOnDatabase } from '@tests/factories/make-event-registration'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { setupManagerWithEventCycle } from '@tests/factories/setup-event'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

describe('(E2E) - GET /api/v1/events/me/registrations', () => {
  afterAll(async () => await app.close())

  it('should return only my registrations with the event and project, newest first', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: otherUser } = await authenticateUser()
    const first = await setupManagerWithEventCycle({ name: 'Primeiro evento' })
    const second = await setupManagerWithEventCycle({ name: 'Segundo evento' })
    const { project: olderProject } = await makeProjectOnDatabase({
      author: user.id,
      title: 'Projeto antigo',
    })
    const { project: newerProject } = await makeProjectOnDatabase({
      author: user.id,
      title: 'Projeto novo',
    })
    const { project: otherProject } = await makeProjectOnDatabase({
      author: otherUser.id,
      title: 'Projeto alheio',
    })
    const { registration: older } = await makeEventRegistrationOnDatabase({
      eventId: new UniqueEntityId(first.event.id),
      projectId: olderProject.id,
      responsibleUserId: user.id,
      registeredAt: new Date('2026-01-01T00:00:00Z'),
    })
    const { registration: newer } = await makeEventRegistrationOnDatabase({
      eventId: new UniqueEntityId(second.event.id),
      projectId: newerProject.id,
      responsibleUserId: user.id,
      registeredAt: new Date('2026-02-01T00:00:00Z'),
    })
    await makeEventRegistrationOnDatabase({
      eventId: new UniqueEntityId(first.event.id),
      projectId: otherProject.id,
      responsibleUserId: otherUser.id,
    })

    const response = await request(app.server)
      .get('/api/v1/events/me/registrations')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.registrations.map((registration: { id: string }) => registration.id)).toEqual([
      newer.id.toString(),
      older.id.toString(),
    ])
    expect(response.body.registrations[0].event).toEqual({
      id: second.event.id,
      slug: second.event.slug,
      name: 'Segundo evento',
      phase: second.event.phase,
    })
    expect(response.body.registrations[0].project).toEqual({
      id: newerProject.id.toString(),
      slug: newerProject.slug,
      title: 'Projeto novo',
    })
    expect(response.body.registrations[0].status).toBe('PENDING')
  })

  it('should return an empty list when I have no registrations', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/events/me/registrations')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ registrations: [] })
  })

  it('should not be able to fetch my registrations without authentication', async () => {
    const response = await request(app.server).get('/api/v1/events/me/registrations')

    expect(response.status).toBe(401)
  })
})
