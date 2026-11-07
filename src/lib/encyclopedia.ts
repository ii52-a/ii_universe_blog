export type TutorialCollection = 'academic' | 'fun'
export type TutorialOrder = { kind: 'courses'; slugs: string[] } | { kind: 'chapters'; course: string; slugs: string[] } | { kind: 'sections'; course: string; chapter: string; slugs: string[] }
export const canManageTutorials = (user: { id: string; role: string } | null) => user?.id === '00000000-0000-4000-8000-000000000002' && user.role === 'admin'
export interface TutorialCourse {
  slug: string; title: string; description: string; category: string; color: string
  chapterCount: number; sectionCount: number
  collection: TutorialCollection
}
export interface TutorialSectionOutline { slug: string; title: string }
export interface TutorialChapterOutline { slug: string; title: string; sections: TutorialSectionOutline[] }
export interface TutorialCourseDetail extends TutorialCourse { chapters: TutorialChapterOutline[] }
export interface TutorialChapter {
  slug: string; title: string; body: string; updatedAt: string
  sections: (TutorialSectionOutline & { body: string })[]
}
export interface TutorialSearchResult {
  collection: TutorialCollection
  courseSlug: string; courseTitle: string; chapterSlug: string; chapterTitle: string
  sectionSlug: string | null; title: string; snippet: string
}
export const tutorialUrl = (course: string, chapter?: string, section?: string | null) =>
  `/encyclopedia/${encodeURIComponent(course)}${chapter ? `/${encodeURIComponent(chapter)}` : ''}${section ? `#${encodeURIComponent(section)}` : ''}`
