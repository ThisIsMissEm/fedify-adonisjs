import { createFederationBuilder } from '@fedify/fedify'
import { FederationBuilder, TContextData } from '../src/types.js'
import app from '@adonisjs/core/services/app'

let builder: FederationBuilder = createFederationBuilder<TContextData>()

app.container.bindValue('fedify', builder)

export { builder as default }
