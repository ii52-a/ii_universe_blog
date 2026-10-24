import { NextRequest, NextResponse } from 'next/server'
import { handleRouteError } from '../../../../lib/http'
import { searchGithubRepos } from '../../../../lib/github'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') ?? ''
    const language = request.nextUrl.searchParams.get('language') ?? ''
    const items = await searchGithubRepos(q, language, 10)
    return NextResponse.json(
      { items, query: q, language, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
