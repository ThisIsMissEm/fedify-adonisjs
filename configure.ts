/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import ConfigureCommand from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()

  await codemods.installPackages([
    {
      name: '@fedify/fedify',
      isDevDependency: false,
    },
  ])

  /**
   * Define the environment variables
   */
  await codemods.defineEnvValidations({
    variables: {
      PUBLIC_URL: `Env.schema.string({ format: 'url', tld: false })`,
      DOMAIN: `Env.schema.string.optional({ format: 'host' })`,
    },
    leadingComment: 'Variables for configuring Fedify',
  })

  await codemods.defineEnvVariables({
    PUBLIC_URL: 'http://$HOST:$PORT/',
  })

  /**
   * Define the configuration file
   */
  await codemods.makeUsingStub(stubsRoot, 'config/fedify.stub', {
    packageName: '@fedify/adonisjs',
  })

  /**
   * Register provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider(`@fedify/adonisjs/provider`)
  })

  await codemods.registerMiddleware('server', [
    {
      path: '@fedify/adonisjs/middleware',
    },
  ])
}
