import type { DbClient } from './db'
import type { TutorialChapter, TutorialCourse, TutorialCourseDetail, TutorialSearchResult, TutorialCollection } from '../../src/lib/encyclopedia'

export const encyclopediaSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS tutorial_courses (
    slug text PRIMARY KEY, title text NOT NULL, description text NOT NULL, category text NOT NULL,
    color text NOT NULL, position integer NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(),
    collection text NOT NULL DEFAULT 'academic' CHECK (collection IN ('academic','fun'))
  )`,
  `ALTER TABLE tutorial_courses ADD COLUMN IF NOT EXISTS collection text NOT NULL DEFAULT 'academic' CHECK (collection IN ('academic','fun'))`,
  `CREATE TABLE IF NOT EXISTS tutorial_chapters (
    course_slug text NOT NULL REFERENCES tutorial_courses(slug) ON DELETE CASCADE,
    slug text NOT NULL, title text NOT NULL, body text NOT NULL DEFAULT '', position integer NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (course_slug, slug), UNIQUE (course_slug, position)
  )`,
  `CREATE TABLE IF NOT EXISTS tutorial_sections (
    course_slug text NOT NULL, chapter_slug text NOT NULL, slug text NOT NULL,
    title text NOT NULL, body text NOT NULL, position integer NOT NULL,
    PRIMARY KEY (course_slug, chapter_slug, slug), UNIQUE (course_slug, chapter_slug, position),
    FOREIGN KEY (course_slug, chapter_slug) REFERENCES tutorial_chapters(course_slug, slug) ON DELETE CASCADE
  )`,
]
interface CourseRow extends Record<string, unknown> {
  slug: string; title: string; description: string; category: string; color: string; chapter_count: number; section_count: number
  collection: TutorialCollection
}
const courseColumns = `c.slug,c.title,c.description,c.category,c.color,c.collection,
  (SELECT count(*)::int FROM tutorial_chapters WHERE course_slug=c.slug) AS chapter_count,
  (SELECT count(*)::int FROM tutorial_sections WHERE course_slug=c.slug) AS section_count`
function mapCourse(row: CourseRow): TutorialCourse {
  return { slug: row.slug, title: row.title, description: row.description, category: row.category, color: row.color,
    chapterCount: Number(row.chapter_count), sectionCount: Number(row.section_count), collection: row.collection }
}
export async function listTutorialCourses(db: DbClient): Promise<TutorialCourse[]> {
  const result = await db.query<CourseRow>(`SELECT ${courseColumns} FROM tutorial_courses c ORDER BY c.position,c.slug`)
  return result.rows.map(mapCourse)
}
export async function getTutorialCourse(db: DbClient, slug: string): Promise<TutorialCourseDetail | null> {
  const course = (await db.query<CourseRow>(`SELECT ${courseColumns} FROM tutorial_courses c WHERE c.slug=$1`, [slug])).rows[0]
  if (!course) return null
  const chapters = await db.query<{ slug: string; title: string }>('SELECT slug,title FROM tutorial_chapters WHERE course_slug=$1 ORDER BY position', [slug])
  const sections = await db.query<{ chapter_slug: string; slug: string; title: string }>('SELECT chapter_slug,slug,title FROM tutorial_sections WHERE course_slug=$1 ORDER BY position', [slug])
  return { ...mapCourse(course), chapters: chapters.rows.map(chapter => ({ ...chapter,
    sections: sections.rows.filter(section => section.chapter_slug === chapter.slug).map(({ slug, title }) => ({ slug, title })) })) }
}
export async function getTutorialChapter(db: DbClient, course: string, slug: string): Promise<TutorialChapter | null> {
  const chapter = (await db.query<{ slug: string; title: string; body: string; updated_at: string }>(
    'SELECT slug,title,body,updated_at FROM tutorial_chapters WHERE course_slug=$1 AND slug=$2', [course, slug])).rows[0]
  if (!chapter) return null
  const sections = await db.query<{ slug: string; title: string; body: string }>(
    'SELECT slug,title,body FROM tutorial_sections WHERE course_slug=$1 AND chapter_slug=$2 ORDER BY position', [course, slug])
  return { slug: chapter.slug, title: chapter.title, body: chapter.body, updatedAt: new Date(chapter.updated_at).toISOString(), sections: sections.rows }
}
export async function searchTutorials(db: DbClient, query: string, collection?: TutorialCollection): Promise<TutorialSearchResult[]> {
  if (!query.trim()) return []
  const result = await db.query<{
    course_slug: string; course_title: string; chapter_slug: string; chapter_title: string
    section_slug: string | null; title: string; body: string
    collection: TutorialCollection
  }>(`WITH documents AS (
      SELECT c.slug AS course_slug,c.title AS course_title,ch.slug AS chapter_slug,ch.title AS chapter_title,
        s.slug AS section_slug,s.title,s.body,c.position AS course_position,ch.position AS chapter_position,s.position AS section_position,c.collection
      FROM tutorial_sections s JOIN tutorial_chapters ch ON ch.course_slug=s.course_slug AND ch.slug=s.chapter_slug
      JOIN tutorial_courses c ON c.slug=s.course_slug
      UNION ALL
      SELECT c.slug,c.title,ch.slug,ch.title,NULL,ch.title,ch.body,c.position,ch.position,-1,c.collection
      FROM tutorial_chapters ch JOIN tutorial_courses c ON c.slug=ch.course_slug
    ) SELECT * FROM documents WHERE strpos(lower(title||' '||body),lower($1))>0 AND ($2::text IS NULL OR collection=$2)
    ORDER BY CASE WHEN strpos(lower(title),lower($1))>0 THEN 0 ELSE 1 END,course_position,chapter_position,section_position LIMIT 30`, [query.trim(), collection ?? null])
  return result.rows.map(row => {
    const text = row.body.replace(/```[\s\S]*?```/g, ' ').replace(/[#*`>|]/g, '').replace(/\s+/g, ' ').trim()
    const index = text.toLowerCase().indexOf(query.toLowerCase()), start = Math.max(0, index - 40)
    return { collection: row.collection, courseSlug: row.course_slug, courseTitle: row.course_title, chapterSlug: row.chapter_slug, chapterTitle: row.chapter_title,
      sectionSlug: row.section_slug, title: row.title, snippet: `${start ? '…' : ''}${text.slice(start, start + 180)}${text.length > start + 180 ? '…' : ''}` }
  })
}
