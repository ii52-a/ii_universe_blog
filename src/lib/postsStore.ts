import { useEffect, useSyncExternalStore } from 'react'
import { type ArticleStyle, type ContentBlock, type CoverVariant, type Post } from '../data/posts'
import { postsApi, type ApiPost, type PostInput } from './backend'

const listeners = new Set<() => void>()
let snapshot: Post[] = []
let loadPromise: Promise<Post[]> | null = null
let loadError: Error | null = null
let loadedAt = 0
let state = { loading: true, error: null as Error | null }
function setState(loading: boolean, error: Error | null) {
  state = { loading, error }
  listeners.forEach((listener) => listener())
}
export function usePostsStatus() {
  return useSyncExternalStore(subscribePosts, () => state, () => state)
}

function emit(next: Post[]) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

export function mapApiPost(post: ApiPost): Post {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    tags: post.tags,
    publishedAt: post.publishedAt,
    readMinutes: post.readMinutes,
    cover: post.cover as CoverVariant,
    style: post.style,
    kind: post.kind,
    status: post.status,
    reviewNote: post.reviewNote,
    reviewedAt: post.reviewedAt,
    authorId: post.authorId,
    authorName: post.authorName,
    authorHandle: post.authorHandle,
    authorColor: post.authorColor,
    authorAvatar: post.authorAvatar ?? post.avatar,
    authorRole: post.authorRole,
    authorLocation: post.authorLocation,
    userGenerated: post.userGenerated,
    content: post.content,
  }
}

export function subscribePosts(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPostsSnapshot() {
  return snapshot
}

export function getPostsError() {
  return loadError
}

export function getPostBySlug(slug?: string) {
  return snapshot.find((post) => post.slug === slug)
}

export async function refreshPosts(): Promise<Post[]> {
  if (loadPromise) {
    await loadPromise
    return refreshPosts()
  }
  loadedAt = 0
  return loadPosts()
}

export async function loadPosts(): Promise<Post[]> {
  if (loadPromise) return loadPromise
  if (loadedAt && Date.now() - loadedAt < 60_000) return snapshot
  setState(true, null)
  loadPromise = (async () => {
    try {
      const next: Post[] = []
      let cursor: string | undefined
      const seen = new Set<string>()
      do {
        const result = await postsApi.list({ limit: 10, cursor })
        next.push(...result.posts.map(mapApiPost))
        cursor = result.nextCursor ?? undefined
        if (cursor && seen.has(cursor)) throw new Error('文章分页异常，请重试')
        if (cursor) seen.add(cursor)
      } while (cursor)
      loadError = null
      loadedAt = Date.now()
      emit([...new Map(next.map((post) => [post.id, post])).values()])
    } catch (error) {
      loadError = error instanceof Error ? error : new Error('文章加载失败')
    } finally {
      setState(false, loadError)
      loadPromise = null
    }
    return snapshot
  })()
  return loadPromise
}

export interface NewPostInput {
  title: string
  excerpt: string
  category: string
  tags: string[]
  cover: CoverVariant
  style: ArticleStyle
  content: ContentBlock[]
  body: string
}

function toApiInput(input: NewPostInput): PostInput {
  return {
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    content: input.content,
    category: input.category,
    tags: input.tags,
    cover: input.cover,
    style: input.style,
  }
}

export async function publishPost(input: NewPostInput) {
  const result = await postsApi.create(toApiInput(input))
  await refreshPosts()
  return mapApiPost(result.post)
}

export async function updatePost(slug: string, input: NewPostInput) {
  const result = await postsApi.update(slug, toApiInput(input))
  await refreshPosts()
  return mapApiPost(result.post)
}

export async function deletePost(slug: string) {
  await postsApi.remove(slug)
  await refreshPosts()
}

export function usePosts() {
  useEffect(() => {
    void loadPosts()
  }, [])
  return useSyncExternalStore(subscribePosts, getPostsSnapshot, getPostsSnapshot)
}
