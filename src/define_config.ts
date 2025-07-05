import { InvalidArgumentsException } from '@adonisjs/core/exceptions'
import { configProvider } from '@adonisjs/core'
import type { ConfigProvider } from '@adonisjs/core/types'
import { MemoryKvStore } from '@fedify/fedify'
import { FederationOptions } from './types.js'

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Define the config for respondWith
 */
export function defineConfig(
  config: PartialBy<FederationOptions, 'kv'>
): ConfigProvider<FederationOptions> {
  return configProvider.create(async () => {
    if (!config.origin) {
      throw new InvalidArgumentsException(
        'Fedify config requires an origin, this should come from an environment variable'
      )
    }

    return {
      ...config,
      kv: config.kv ?? new MemoryKvStore(),
    }
  })
}
