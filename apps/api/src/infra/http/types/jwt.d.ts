declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      jti: string
    }
    user: {
      sub: string
      jti: string
    }
  }
}

export {}
