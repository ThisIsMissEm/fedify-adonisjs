import { createFederationBuilder } from '@fedify/fedify'
import { TContextData } from './types.js'

export const builder = createFederationBuilder<TContextData>()
