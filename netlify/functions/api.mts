import type { Config } from '@netlify/functions'
import type { AddressInfo } from 'net'

// The Express app in server.ts serves every /api/* route. Inside the function it listens on an
// ephemeral local port and requests are proxied to it, which keeps the streaming endpoints working.
let origin: Promise<string> | null = null

function startExpress(): Promise<string> {
  process.env.REBO_SERVERLESS = 'true'
  return import('../../server').then(
    ({ default: app }) =>
      new Promise<string>((resolve, reject) => {
        const server = app.listen(0, '127.0.0.1', () => {
          const { port } = server.address() as AddressInfo
          resolve(`http://127.0.0.1:${port}`)
        })
        server.on('error', reject)
      }),
  )
}

export default async (req: Request) => {
  origin ??= startExpress().catch((error) => {
    origin = null
    throw error
  })
  const url = new URL(req.url)
  const headers = new Headers(req.headers)
  headers.delete('host')
  headers.delete('content-length')

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const response = await fetch(`${await origin}${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
  })

  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')
  return new Response(response.body, { status: response.status, headers: responseHeaders })
}

export const config: Config = {
  path: '/api/*',
}
