import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { env } from '@/environment-variables'

const app = fastify({
  logger:
    process.env.NODE_ENV === 'test'
      ? undefined
      : { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } } },
}).withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors)

app.register(fastifyCookie, {
  secret: env.COOKIE_SECRET,
})

// TODO: Setar Error Handler

// Swagger
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'API do Projeto',
      description: 'API do Projeto',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

// Swagger UI
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

// Routes
app.get('/health', (_, reply) => {
  return reply.status(200).send({ status: 'ok' })
})

export { app }
