import app from '@adonisjs/core/services/app'
import { Federation } from '../src/types.js'

let federation: Federation

await app.ready(async () => {
  federation = await app.container.make('federation')
})

export { federation as default }
