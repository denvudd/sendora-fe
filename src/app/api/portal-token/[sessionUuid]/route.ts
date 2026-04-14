import type { NextRequest } from 'next/server'

import { findSessionByUuid } from '@features/commercial/repositories'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

interface RouteParams {
  params: Promise<{ sessionUuid: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  const { sessionUuid } = await params

  const session = await findSessionByUuid({ sessionUuid })

  if (!session?.portalToken) {
    return Response.json(
      { error: 'Portal token not found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  return Response.json(
    { portalUrl: `/portal/${session.portalToken}` },
    { headers: CORS_HEADERS },
  )
}
