import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/exception'
import type { ApplicationService, ConfigProvider } from '@adonisjs/core/types'

import type { FederationOptions } from '../src/types.js'
import { pathToFileURL } from 'node:url'
import fastglob from 'fast-glob'
import { builder } from '../src/builder.js'

export default class FedifyProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('fedify.config', async () => {
      const fedifyConfigProvider = this.app.config.get<ConfigProvider<FederationOptions>>('fedify')

      console.log({ fedifyConfigProvider })

      /**
       * Resolve config from the provider
       */
      const config = await configProvider.resolve<FederationOptions>(this.app, fedifyConfigProvider)
      console.log({ config })
      if (!config) {
        throw new RuntimeException(
          'Invalid "config/fedify.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return config
    })
  }

  async boot() {
    const federatonDir = this.app.makePath('app', 'federation')
    const files = await fastglob(`${federatonDir}/**/*.ts`)

    for (const file of files) {
      const modulePath = pathToFileURL(file).href

      await import(modulePath)
      console.log(builder)
    }

    this.app.container.singleton('federation', async () => {
      const fedifyConfig = await this.app.container.make('fedify.config')

      console.log(builder)

      return await builder.build(fedifyConfig)
    })
  }
}
