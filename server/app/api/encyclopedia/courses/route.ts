import { NextResponse } from 'next/server'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { listTutorialCourses } from '../../../../lib/encyclopedia'
import { handleRouteError } from '../../../../lib/http'
import { readJson } from '../../../../lib/http'
import { NextRequest } from 'next/server'
import { tutorialAdminRoute, newCourseSchema, createTutorialCourse } from '../../../../lib/encyclopediaAdmin'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    await ensureDatabase()
    return NextResponse.json({ courses: await listTutorialCourses(await getDatabase()) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return handleRouteError(error) }
}
export async function POST(request: NextRequest) {
  return tutorialAdminRoute(request, async db => {
    const input = newCourseSchema.parse(await readJson(request))
    await createTutorialCourse(db, input)
    return NextResponse.json({ slug: input.slug }, { status: 201 })
  })
}
