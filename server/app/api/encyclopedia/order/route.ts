import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '../../../../lib/http'
import { tutorialAdminRoute, tutorialOrderSchema, reorderTutorials } from '../../../../lib/encyclopediaAdmin'

export const dynamic = 'force-dynamic'
export async function PATCH(request: NextRequest) {
  return tutorialAdminRoute(request, async db => {
    await reorderTutorials(db, tutorialOrderSchema.parse(await readJson(request)))
    return NextResponse.json({ saved: true })
  })
}
