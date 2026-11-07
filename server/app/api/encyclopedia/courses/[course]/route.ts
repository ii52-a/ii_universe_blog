import { NextResponse } from 'next/server'
import { ensureDatabase, getDatabase } from '../../../../../lib/db'
import { getTutorialCourse } from '../../../../../lib/encyclopedia'
import { ApiError, handleRouteError } from '../../../../../lib/http'
import { readJson } from '../../../../../lib/http'
import { NextRequest } from 'next/server'
import { tutorialAdminRoute, updateCourseSchema, updateTutorialCourse, deleteTutorialCourse, newChapterSchema, createTutorialChapter } from '../../../../../lib/encyclopediaAdmin'

export const dynamic = 'force-dynamic'
export async function GET(_request: Request, context: { params: Promise<{ course: string }> }) {
  try {
    const { course } = await context.params
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(course)) throw new ApiError(404, 'COURSE_NOT_FOUND', '没有这门教程')
    await ensureDatabase()
    const result = await getTutorialCourse(await getDatabase(), course)
    if (!result) throw new ApiError(404, 'COURSE_NOT_FOUND', '没有这门教程')
    return NextResponse.json({ course: result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return handleRouteError(error) }
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ course: string }> }) {
  return tutorialAdminRoute(request, async db => {
    const { course } = await context.params
    await updateTutorialCourse(db, course, updateCourseSchema.parse(await readJson(request)))
    return NextResponse.json({ slug: course })
  })
}
export async function POST(request: NextRequest, context: { params: Promise<{ course: string }> }) {
  return tutorialAdminRoute(request, async db => {
    const input = newChapterSchema.parse(await readJson(request))
    await createTutorialChapter(db, (await context.params).course, input)
    return NextResponse.json({ slug: input.slug }, { status: 201 })
  })
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ course: string }> }) {
  return tutorialAdminRoute(request, async db => {
    await deleteTutorialCourse(db, (await context.params).course)
    return NextResponse.json({ deleted: true })
  })
}
