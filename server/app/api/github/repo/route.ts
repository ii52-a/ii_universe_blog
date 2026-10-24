import { NextRequest, NextResponse } from 'next/server'
import { handleRouteError } from '../../../../lib/http'
import { getGithubRepo } from '../../../../lib/github'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const owner = request.nextUrl.searchParams.get('owner') ?? ''
    const repo = request.nextUrl.searchParams.get('repo') ?? ''
    const data = await getGithubRepo(owner, repo)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
