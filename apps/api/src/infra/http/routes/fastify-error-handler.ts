import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import { hasZodFastifySchemaValidationErrors as isZodValidationError } from 'fastify-type-provider-zod'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const fastifyErrorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (isZodValidationError(error)) {
    return reply.status(400).send({
      message: error.message,
      details: {
        issues: error.validation,
      },
    })
  }

  // Salva nos logs locais apenas erros desconhecidos
  // Para os erros conhecidos ja foram tratados em suas respectivas rotas/controllers
  if (error instanceof Error) {
    try {
      const logDir = path.resolve(process.cwd(), 'logs')

      if (!existsSync(logDir)) {
        mkdirSync(logDir)
      }

      const logFile = path.join(logDir, 'error.log')
      const logEntry = `${JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          error: {
            message: error.message as string,
            stack: error.stack as string,
            name: error.name as string,
          },
          request: {
            method: request.method,
            url: request.url,
            headers: request.headers,
            ip: request.ip,
            body: request.body,
            params: request.params,
            query: request.query,
          },
        },
        null,
        2,
      )},\n`

      appendFileSync(logFile, logEntry)
    } catch (_) {}
  }

  return reply.status(500).send({
    message: 'Internal server error',
  })
}
