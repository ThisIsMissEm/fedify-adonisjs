import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { FederationOrigin } from '@fedify/fedify'
import { Readable } from 'node:stream'

const ignoredRoutePrefixes = ['/resources/', '/node_modules/', '/@vite/']

export default class FedifyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // These are routes that would never be handled by Fedify, so we don't even
    // pass those through fedify:
    if (ignoredRoutePrefixes.some((prefix) => ctx.request.url().startsWith(prefix))) {
      return await next()
    }

    const federation = await ctx.containerResolver.make('federation')

    // Convert the Adonis.js Request to the Fedify Request type:
    const request = this.fromRequest(ctx.request, federation.origin)

    // Setup a `federation` context on the Adonis.js HttpContext, see the typing
    // at the end of this file.
    ctx.federation = federation.createContext(request)

    let notFound = false
    let notAcceptable = false
    const response = await federation.fetch(request, {
      onNotFound: async () => {
        // If the `federation` object finds a request not responsible for it
        // (i.e., not a federation-related request), it will call the `next`
        // function provided by the Adonis.js framework to continue the handling
        // request:
        notFound = true

        ctx.logger.info(
          {
            url: request.url,
          },
          'Passing through to Adonis.js Router'
        )

        await next()

        // This is unused, by Fedify wants this method to always return a `Response` type:
        return new Response('Not found', { status: 404 })
      },
      onNotAcceptable: async () => {
        // Similar to `onNotFound`, but slightly more tricky.
        // When the `federation` object finds a request not acceptable
        // type-wise (i.e., a user-agent doesn't want JSON-LD), it will call
        // the `next` function provided by the Express framework to continue
        // if any route is matched, and otherwise, it will return a 406 Not
        // Acceptable response:
        notAcceptable = true

        ctx.logger.info('Passing through to not acceptable')
        ctx.response.header('Vary', 'Accept')

        await next()

        // This is unused, by Fedify wants this method to always return a `Response` type:
        return new Response('Not acceptable', {
          status: 406,
          headers: {
            'Content-Type': 'text/plain',
            'Vary': 'Accept',
          },
        })
      },
    })

    if (!ctx.response.hasContent && notAcceptable) {
      return ctx.response.notAcceptable('Not acceptable')
    }

    if (!ctx.response.hasContent && notFound) {
      return ctx.response.notFound('Not found')
    }

    if (notFound || notAcceptable) {
      ctx.logger.debug('Response handled by adonis.js')
      return
    }

    ctx.logger.debug('Response handled by fedify')
    await this.sendResponse(response, ctx.response)
  }

  private fromRequest(req: HttpContext['request'], origin: string | FederationOrigin): Request {
    const federationUrl = typeof origin === 'object' ? origin.webOrigin : origin

    const url = new URL(req.completeUrl(true), federationUrl)
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers())) {
      if (Array.isArray(value)) {
        for (const v of value) {
          headers.append(key, v)
        }
      } else if (typeof value === 'string') {
        headers.append(key, value)
      }
    }

    return new Request(url, {
      method: req.method(),
      headers,
      duplex: 'half',
      body:
        req.method() === 'GET' || req.method() === 'HEAD' ? undefined : Readable.toWeb(req.request),
    })
  }

  private sendResponse(response: Response, res: HttpContext['response']) {
    res.status(response.status)

    response.headers.forEach((value, key) => {
      res.header(key, value)
    })

    if (response.body !== null) {
      res.stream(Readable.fromWeb(response.body))
    }
  }
}
