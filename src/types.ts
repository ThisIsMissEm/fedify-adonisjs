import type * as fedify from '@fedify/fedify'

export type TContextData = void

export type FederationOptions = fedify.FederationOptions<TContextData>
export type Federation = fedify.Federation<TContextData>
export type FederationBuilder = fedify.FederationBuilder<TContextData>

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    federation: fedify.RequestContext<TContextData>
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'fedify': fedify.FederationBuilder<TContextData>
    'fedify.config': fedify.FederationOptions<TContextData>
    'federation': fedify.Federation<TContextData>
  }
}
