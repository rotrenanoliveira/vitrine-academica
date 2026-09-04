import { env } from '@/environment-variables'
import { app } from './app'

app.listen(
  {
    port: env.PORT,
    host: '0.0.0.0',
  },
  (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`[HTTP]: Server is running on ${address}`)
  },
)
