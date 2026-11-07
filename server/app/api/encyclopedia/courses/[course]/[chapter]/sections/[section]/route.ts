import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '../../../../../../../../lib/http'
import { tutorialAdminRoute, updateSectionSchema, updateTutorialSection, deleteTutorialSection } from '../../../../../../../../lib/encyclopediaAdmin'
export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ course: string; chapter: string; section: string }> }
export async function PATCH(request: NextRequest, context: Context) {
  return tutorialAdminRoute(request, async db => {
    const { course, chapter, section } = await context.params
    await updateTutorialSection(db, course, chapter, section, updateSectionSchema.parse(await readJson(request)))
    return NextResponse.json({ slug: section })
  })
}
export async function DELETE(request: NextRequest, context: Context) {
  return tutorialAdminRoute(request, async db => {
    const { course, chapter, section } = await context.params
    await deleteTutorialSection(db, course, chapter, section)
    return NextResponse.json({ deleted: true })
  })
}
