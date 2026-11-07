import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DbClient } from './db'
import type { TutorialCollection } from '../../src/lib/encyclopedia'

interface TutorialSeed {
  slug: string
  title: string
  category: string
  color: string
  description: string
  collection?: TutorialCollection
}

const initialTutorials: readonly TutorialSeed[] = [
  { slug: 'github', title: 'GitHub', category: '工具与协作', color: '#536485', description: '从仓库、Markdown 到分支协作、冲突处理、Actions 与网页发布。' },
  { slug: 'html', title: 'HTML', category: 'Web 入门', color: '#ad5b36', description: '创建第一个网页，学习文本、链接、图片、语义结构、表格与表单。' },
  { slug: 'css', title: 'CSS', category: 'Web 入门', color: '#3d6c9e', description: '从选择器和盒模型开始，完成排版、Flex、Grid 与响应式布局。' },
  { slug: 'javascript', title: 'JavaScript', category: 'Web 入门', color: '#8a711e', description: '从变量与函数开始，逐步掌握 DOM、事件、异步请求和本地存储。' },
]
const universeTutorial: TutorialSeed = {
  slug: 'iiuniverse', title: '艾宇宙技术栈全析', category: '全析', color: '#846d52', collection: 'fun',
  description: '从零读懂艾宇宙源码。逐步学习 React、TypeScript、Three.js、PostgreSQL、GitHub API 和星盘五子棋搜索。',
}
interface SeedSection { slug: string; title: string; lines: string[] }
interface SeedChapter extends SeedSection { sections: SeedSection[] }
export function parseTutorial(source: string): SeedChapter[] {
  const chapters: SeedChapter[] = []
  let chapter: SeedChapter | undefined, section: SeedSection | undefined, fence = '', fenceLength = 0
  for (const line of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (marker) {
      if (!fence) { fence = marker[0]; fenceLength = marker.length }
      else if (marker[0] === fence && marker.length >= fenceLength) fence = ''
      ;(section ?? chapter)?.lines.push(line); continue
    }
    const heading = !fence && /^(##|###) ([a-z][a-z0-9-]*) \| (.+)$/.exec(line)
    if (heading && heading[1] === '##') {
      chapter = { slug: heading[2], title: heading[3], lines: [], sections: [] }; chapters.push(chapter); section = undefined
    } else if (heading && chapter) {
      section = { slug: heading[2], title: heading[3], lines: [] }; chapter.sections.push(section)
    } else (section ?? chapter)?.lines.push(line)
  }
  if (fence || !chapters.length || new Set(chapters.map(c => c.slug)).size !== chapters.length) throw new Error('教程章节或代码围栏无效')
  for (const item of chapters) if (!item.sections.length || new Set(item.sections.map(s => s.slug)).size !== item.sections.length || item.sections.some(s => !s.lines.join('').trim())) throw new Error(`教程小节无效：${item.slug}`)
  return chapters
}
export async function seedEncyclopedia(db: DbClient, { refresh = false }: { refresh?: boolean } = {}) {
  await seedCourses(db, 'encyclopedia_seed_v1', initialTutorials, { refresh })
  await seedCourses(db, 'encyclopedia_iiuniverse_v2', [universeTutorial], { refresh, append: true, updateContent: true })
}

async function seedCourses(db: DbClient, seedKey: string, seeds: readonly TutorialSeed[],
  { refresh, append = false, updateContent = refresh }: { refresh: boolean; append?: boolean; updateContent?: boolean },
) {
  if (!refresh && (await db.query('SELECT value FROM app_meta WHERE key=$1', [seedKey])).rows.length) return
  const sources = seeds.map(course => ({ ...course, chapters: parseTutorial(readFileSync(join(process.cwd(), 'db', 'tutorials', `${course.slug}.md`), 'utf8')) }))
  await db.transaction(async tx => {
    // Only the transaction that inserts this marker imports the initial curriculum.
    const claim = await tx.query('INSERT INTO app_meta(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING RETURNING key', [seedKey, '1'])
    if (!refresh && !claim.rows.length) return
    if (append) await tx.exec('LOCK TABLE tutorial_courses IN SHARE ROW EXCLUSIVE MODE')
    const updatePosition = append ? '' : ',position=EXCLUDED.position'
    const courseConflict = refresh ? `DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,category=EXCLUDED.category,color=EXCLUDED.color,updated_at=now()${updatePosition}` : 'DO NOTHING'
    const chapterConflict = updateContent ? `DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,updated_at=now()${updatePosition}` : 'DO NOTHING'
    const sectionConflict = updateContent ? `DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body${updatePosition}` : 'DO NOTHING'
    for (const [position, course] of sources.entries()) {
      await tx.query(`INSERT INTO tutorial_courses(slug,title,description,category,color,collection,position)
        VALUES($1,$2,$3,$4,$5,$6,COALESCE($7,(SELECT COALESCE(max(position),-1)+1 FROM tutorial_courses))) ON CONFLICT(slug) ${courseConflict}`,
        [course.slug, course.title, course.description, course.category, course.color, course.collection ?? 'academic', append ? null : position])
      for (const [chapterPosition, chapter] of course.chapters.entries()) {
        await tx.query(`INSERT INTO tutorial_chapters(course_slug,slug,title,body,position)
          VALUES($1,$2,$3,$4,COALESCE($5,(SELECT COALESCE(max(position),-1)+1 FROM tutorial_chapters WHERE course_slug=$1))) ON CONFLICT(course_slug,slug) ${chapterConflict}`,
          [course.slug, chapter.slug, chapter.title, chapter.lines.join('\n').trim(), append ? null : chapterPosition])
        for (const [sectionPosition, section] of chapter.sections.entries()) await tx.query(
          `INSERT INTO tutorial_sections(course_slug,chapter_slug,slug,title,body,position)
          VALUES($1,$2,$3,$4,$5,COALESCE($6,(SELECT COALESCE(max(position),-1)+1 FROM tutorial_sections WHERE course_slug=$1 AND chapter_slug=$2))) ON CONFLICT(course_slug,chapter_slug,slug) ${sectionConflict}`,
          [course.slug, chapter.slug, section.slug, section.title, section.lines.join('\n').trim(), append ? null : sectionPosition])
      }
    }
  })
}
