import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '../../../../../../../lib/http'
import { tutorialAdminRoute, newSectionSchema, createTutorialSection } from '../../../../../../../lib/encyclopediaAdmin'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest, context: { params: Promise<{ course: string; chapter: string }> }) {
  return tutorialAdminRoute(request, async db => {
    const { course, chapter } = await context.params, input = newSectionSchema.parse(await readJson(request))
    await createTutorialSection(db, course, chapter, input)
    return NextResponse.json({ slug: input.slug }, { status: 201 })
  })
}
