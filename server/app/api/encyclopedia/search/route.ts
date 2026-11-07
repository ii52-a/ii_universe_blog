import { NextRequest, NextResponse } from 'next/server'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { searchTutorials } from '../../../../lib/encyclopedia'
import { ApiError, handleRouteError } from '../../../../lib/http'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const query = (request.nextUrl.searchParams.get('q') ?? '').trim()
    const collection = request.nextUrl.searchParams.get('collection')
    if (collection && !['academic','fun'].includes(collection)) throw new ApiError(400, 'INVALID_COLLECTION', '没有这个教程目录')
    if (query.length > 100) throw new ApiError(400, 'QUERY_TOO_LONG', '搜索词最多 100 个字符')
    await ensureDatabase()
    return NextResponse.json({ results: await searchTutorials(await getDatabase(), query, collection === 'academic' || collection === 'fun' ? collection : undefined) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return handleRouteError(error) }
}
