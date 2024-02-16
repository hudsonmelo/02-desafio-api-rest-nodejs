import { app } from './app'
import { env } from './env'

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log(`HTTP Server running on http://localhost:${env.PORT}`)
  })
