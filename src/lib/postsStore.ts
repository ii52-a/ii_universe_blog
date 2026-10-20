import { useSyncExternalStore } from 'react'
import { posts as seedPosts, type ContentBlock, type CoverVariant, type Post } from '../data/posts'
import type { User } from '../context/AuthContext'
import { readStorage, writeStorage } from './storage'

const CUSTOM_POSTS_KEY = 'custom-posts.v1'
const listeners = new Set<() => void>()

let customPosts = readStorage<Post[]>(CUSTOM_POSTS_KEY, [])

function buildSnapshot() {
  return [...customPosts, ...seedPosts].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  )
}

let snapshot = buildSnapshot()

function emit() {
  snapshot = buildSnapshot()
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === `halfday.${CUSTOM_POSTS_KEY}`) {
      customPosts = readStorage<Post[]>(CUSTOM_POSTS_KEY, [])
      emit()
    }
  })
}

export function subscribePosts(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPostsSnapshot() {
  return snapshot
}

export function getPostBySlug(slug?: string) {
  return snapshot.find((post) => post.slug === slug)
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

export function publishPost(input: NewPostInput, user: User) {
  const now = new Date()
  const slug = `page-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
  const characters = input.body.replace(/\s/g, '').length
  const post: Post = {
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    category: input.category,
    tags: input.tags.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 4),
    publishedAt: now.toISOString(),
    readMinutes: Math.max(2, Math.ceil(characters / 380)),
    cover: input.cover,
    authorId: user.id,
    authorName: user.name,
    authorHandle: user.handle,
    authorColor: user.avatarColor,
    authorAvatar: user.avatar,
    authorLocation: user.location || undefined,
    userGenerated: true,
    content: input.content,
  }
  customPosts = [post, ...customPosts]
  writeStorage(CUSTOM_POSTS_KEY, customPosts)
  emit()
  return post
}

export function usePosts() {
  return useSyncExternalStore(subscribePosts, getPostsSnapshot, getPostsSnapshot)
}
