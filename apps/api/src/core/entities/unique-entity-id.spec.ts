import { expect, test } from 'vitest'
import { UniqueEntityId } from './unique-entity-id'

test('should be able to create a unique entity id', () => {
  const uniqueEntityId = new UniqueEntityId('new-id')

  expect(uniqueEntityId.toString()).toBe('new-id')
})
