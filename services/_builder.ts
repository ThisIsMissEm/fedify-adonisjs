import app from '@adonisjs/core/services/app'
import { FederationBuilder } from '../src/types.js'

let fedify: FederationBuilder

await app.booted(async () => {
  fedify = await app.container.make('fedify')
})

export { fedify as default }
