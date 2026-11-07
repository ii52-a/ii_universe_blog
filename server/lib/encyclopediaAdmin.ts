import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from './auth'
import { getDatabase, type DbClient } from './db'
import { ApiError, handleRouteError } from './http'
import { canManageTutorials } from '../../src/lib/encyclopedia'

const slug = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/, '地址标识使用小写字母开头，限字母、数字和短横线，最多 64 字符')
const title = z.string().trim().min(1, '请填写标题').max(100, '标题最多 100 字符')
const courseFields = z.object({
  title, description: z.string().trim().max(1000, '简介最多 1000 字符'),
  category: z.string().trim().min(1, '请填写分类').max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '请输入六位十六进制颜色'),
  collection: z.enum(['academic', 'fun']),
}).strict()
export const newCourseSchema = courseFields.extend({ slug: slug.refine(value => value !== 'manage', 'manage 为保留地址，请使用其他标识') })
export const updateCourseSchema = courseFields.partial().refine(input => Object.keys(input).length > 0, '没有需要保存的内容')
export const newChapterSchema = z.object({ slug, title, body: z.string().max(100000).default('') }).strict()
export const updateChapterSchema = z.object({ title: title.optional(), body: z.string().max(100000).optional() }).strict().refine(input => Object.keys(input).length > 0, '没有需要保存的内容')
export const newSectionSchema = z.object({ slug, title, body: z.string().trim().min(1, '请填写正文').max(100000, '正文最多 100000 字符') }).strict()
export const updateSectionSchema = newSectionSchema.omit({ slug: true }).partial().refine(input => Object.keys(input).length > 0, '没有需要保存的内容')
const orderedSlugs = z.array(slug).min(1).max(2000).refine(items => new Set(items).size === items.length, '排序条目不能重复')
export const tutorialOrderSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('courses'), slugs: orderedSlugs }).strict(),
  z.object({ kind: z.literal('chapters'), course: slug, slugs: orderedSlugs }).strict(),
  z.object({ kind: z.literal('sections'), course: slug, chapter: slug, slugs: orderedSlugs }).strict(),
])

function writeTutorials<T>(db: DbClient, run: (tx: DbClient) => Promise<T>) {
  return db.transaction(async tx => {
    await tx.exec('LOCK TABLE tutorial_courses IN SHARE ROW EXCLUSIVE MODE')
    return run(tx)
  })
}
export async function reorderTutorials(db: DbClient, input: z.infer<typeof tutorialOrderSchema>) {
  await writeTutorials(db, async tx => {
    const table = input.kind === 'courses' ? 'tutorial_courses' : input.kind === 'chapters' ? 'tutorial_chapters' : 'tutorial_sections'
    const values = input.kind === 'courses' ? [] : input.kind === 'chapters' ? [input.course] : [input.course, input.chapter]
    const where = input.kind === 'courses' ? '' : input.kind === 'chapters' ? 'WHERE course_slug=$1' : 'WHERE course_slug=$1 AND chapter_slug=$2'
    const rows = (await tx.query<{ slug: string; position: number }>(`SELECT slug,position FROM ${table} ${where} ORDER BY position,slug`, values)).rows
    const current = new Set(rows.map(row => row.slug))
    if (current.size !== input.slugs.length || input.slugs.some(item => !current.has(item))) throw new ApiError(409, 'ORDER_CHANGED', '目录已发生变化，请刷新后重新排序')
    const temporary = Math.max(0, ...rows.map(row => row.position)) + rows.length + 1
    // Vacate occupied positions before assigning the final contiguous order.
    for (const [index, item] of input.slugs.entries()) await tx.query(`UPDATE ${table} SET position=$${values.length + 2} ${where || 'WHERE true'} AND slug=$${values.length + 1}`, [...values, item, temporary + index])
    for (const [index, item] of input.slugs.entries()) await tx.query(`UPDATE ${table} SET position=$${values.length + 2} ${where || 'WHERE true'} AND slug=$${values.length + 1}`, [...values, item, index])
  })
}

export async function tutorialAdminRoute(request: NextRequest, run: (db: DbClient) => Promise<NextResponse>) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!canManageTutorials(user)) throw new ApiError(403, 'FORBIDDEN', '需要 ii52A1 教程管理权限')
    return await run(await getDatabase())
  } catch (error) { return handleRouteError(error) }
}
const missing = (message: string) => new ApiError(404, 'TUTORIAL_NOT_FOUND', message)
async function touch(db: DbClient, course: string, chapter?: string) {
  await db.query('UPDATE tutorial_courses SET updated_at=now() WHERE slug=$1', [course])
  if (chapter) await db.query('UPDATE tutorial_chapters SET updated_at=now() WHERE course_slug=$1 AND slug=$2', [course, chapter])
}
export async function createTutorialCourse(db: DbClient, input: z.infer<typeof newCourseSchema>) {
  await writeTutorials(db, async tx => {
  const result = await tx.query(`INSERT INTO tutorial_courses(slug,title,description,category,color,collection,position)
    VALUES($1,$2,$3,$4,$5,$6,(SELECT COALESCE(max(position),-1)+1 FROM tutorial_courses)) ON CONFLICT(slug) DO NOTHING RETURNING slug`,
  [input.slug, input.title, input.description, input.category, input.color, input.collection])
  if (!result.rows.length) throw new ApiError(409, 'SLUG_EXISTS', '该教程地址已经存在')
  })
}
export async function updateTutorialCourse(db: DbClient, course: string, input: z.infer<typeof updateCourseSchema>) {
  await writeTutorials(db, async tx => {
  const result = await tx.query(`UPDATE tutorial_courses SET title=COALESCE($2,title),description=COALESCE($3,description),category=COALESCE($4,category),
    color=COALESCE($5,color),collection=COALESCE($6,collection),updated_at=now() WHERE slug=$1 RETURNING slug`,
  [course, input.title ?? null, input.description ?? null, input.category ?? null, input.color ?? null, input.collection ?? null])
  if (!result.rows.length) throw missing('没有这门教程')
  })
}
export async function deleteTutorialCourse(db: DbClient, course: string) {
  await writeTutorials(db, async tx => {
    if (!(await tx.query('DELETE FROM tutorial_courses WHERE slug=$1 RETURNING slug', [course])).rows.length) throw missing('没有这门教程')
  })
}
export async function createTutorialChapter(db: DbClient, course: string, input: z.infer<typeof newChapterSchema>) {
  await writeTutorials(db, async tx => {
    if (!(await tx.query('SELECT slug FROM tutorial_courses WHERE slug=$1 FOR UPDATE', [course])).rows.length) throw missing('没有这门教程')
    const result = await tx.query(`INSERT INTO tutorial_chapters(course_slug,slug,title,body,position)
      VALUES($1,$2,$3,$4,(SELECT COALESCE(max(position),-1)+1 FROM tutorial_chapters WHERE course_slug=$1))
      ON CONFLICT(course_slug,slug) DO NOTHING RETURNING slug`, [course, input.slug, input.title, input.body])
    if (!result.rows.length) throw new ApiError(409, 'SLUG_EXISTS', '该章节地址已经存在')
    await touch(tx, course)
  })
}
export async function updateTutorialChapter(db: DbClient, course: string, chapter: string, input: z.infer<typeof updateChapterSchema>) {
  await writeTutorials(db, async tx => {
    const result = await tx.query(`UPDATE tutorial_chapters SET title=COALESCE($3,title),body=COALESCE($4,body),updated_at=now()
      WHERE course_slug=$1 AND slug=$2 RETURNING slug`, [course, chapter, input.title ?? null, input.body ?? null])
    if (!result.rows.length) throw missing('没有这个章节')
    await touch(tx, course)
  })
}
export async function deleteTutorialChapter(db: DbClient, course: string, chapter: string) {
  await writeTutorials(db, async tx => {
    if (!(await tx.query('DELETE FROM tutorial_chapters WHERE course_slug=$1 AND slug=$2 RETURNING slug', [course, chapter])).rows.length) throw missing('没有这个章节')
    await touch(tx, course)
  })
}
export async function createTutorialSection(db: DbClient, course: string, chapter: string, input: z.infer<typeof newSectionSchema>) {
  await writeTutorials(db, async tx => {
    if (!(await tx.query('SELECT slug FROM tutorial_chapters WHERE course_slug=$1 AND slug=$2 FOR UPDATE', [course, chapter])).rows.length) throw missing('没有这个章节')
    const result = await tx.query(`INSERT INTO tutorial_sections(course_slug,chapter_slug,slug,title,body,position)
      VALUES($1,$2,$3,$4,$5,(SELECT COALESCE(max(position),-1)+1 FROM tutorial_sections WHERE course_slug=$1 AND chapter_slug=$2))
      ON CONFLICT(course_slug,chapter_slug,slug) DO NOTHING RETURNING slug`, [course, chapter, input.slug, input.title, input.body])
    if (!result.rows.length) throw new ApiError(409, 'SLUG_EXISTS', '该小节地址已经存在')
    await touch(tx, course, chapter)
  })
}
export async function updateTutorialSection(db: DbClient, course: string, chapter: string, section: string, input: z.infer<typeof updateSectionSchema>) {
  await writeTutorials(db, async tx => {
    const result = await tx.query(`UPDATE tutorial_sections SET title=COALESCE($4,title),body=COALESCE($5,body)
      WHERE course_slug=$1 AND chapter_slug=$2 AND slug=$3 RETURNING slug`, [course, chapter, section, input.title ?? null, input.body ?? null])
    if (!result.rows.length) throw missing('没有这个小节')
    await touch(tx, course, chapter)
  })
}
export async function deleteTutorialSection(db: DbClient, course: string, chapter: string, section: string) {
  await writeTutorials(db, async tx => {
    if (!(await tx.query('DELETE FROM tutorial_sections WHERE course_slug=$1 AND chapter_slug=$2 AND slug=$3 RETURNING slug', [course, chapter, section])).rows.length) throw missing('没有这个小节')
    await touch(tx, course, chapter)
  })
}
