import { useEffect, useSyncExternalStore } from 'react'
import { type ContentBlock, type CoverVariant, type Post } from '../data/posts'
import { postsApi, type ApiPost, type PostInput } from './backend'

const listeners = new Set<() => void>()
let snapshot: Post[] = []
let loadPromise: Promise<Post[]> | null = null
let loadError: Error | null = null

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

export async function refreshPosts() {
  const result = await postsApi.list({ limit: 10 })
  const next = result.posts.map(mapApiPost)
  loadError = null
  emit(next)
  return next
}

export async function loadPosts() {
  if (loadPromise) return loadPromise
  loadPromise = refreshPosts()
    .catch((error) => {
      loadError = error instanceof Error ? error : new Error('文章加载失败')
      return snapshot
    })
    .finally(() => {
      loadPromise = null
    })
  return loadPromise
}

export interface NewPostInput {
  title: string
  excerpt: string
  category: string
  tags: string[]
  cover: CoverVariant
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
