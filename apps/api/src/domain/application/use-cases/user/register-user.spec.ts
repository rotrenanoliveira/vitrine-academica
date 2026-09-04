import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserAlreadyExistsError } from '../../_errors/user-already-exists-error'
import { RegisterUserUseCase } from './register-user'

let usersRepository: InMemoryUsersRepository
let sut: RegisterUserUseCase

describe('(UC) - Register User', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new RegisterUserUseCase(usersRepository)
  })

  it('should be able to register a new user', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.user.id).toBeInstanceOf(UniqueEntityId)
      expect(result.value.user.name).toBe('John Doe')
      expect(result.value.user.email).toBe('johndoe@example.com')
    }
  })

  it('should not be able to register a new user with same email', async () => {
    await sut.execute({ name: 'John Doe', email: 'john.doe@example.com' })

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
    }
  })
})
