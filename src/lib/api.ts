import { seedComments, type Comment } from '../data/comments'
import { makeId, readStorage, sleep, writeStorage } from './storage'

const COMMENTS_KEY = 'comments.v1'
const COMMENT_LIKES_KEY = 'comment-likes.v1'
const POST_LIKES_KEY = 'post-likes.v1'
const POST_BOOKMARKS_KEY = 'post-bookmarks.v1'
const SUBSCRIBERS_KEY = 'subscribers.v1'

function allComments(): Comment[] {
  return readStorage<Comment[]>(COMMENTS_KEY, seedComments)
}

function persist(next: Comment[]) {
  writeStorage(COMMENTS_KEY, next)
}

export const commentsApi = {
  async list(postId: string): Promise<Comment[]> {
    await sleep(240)
    return allComments()
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
  },

  async counts(): Promise<Record<string, number>> {
    return allComments().reduce<Record<string, number>>((acc, comment) => {
      acc[comment.postId] = (acc[comment.postId] ?? 0) + 1
      return acc
    }, {})
  },

  async byAuthor(authorId: string, authorName: string): Promise<Comment[]> {
    await sleep(220)
    return allComments()
      .filter(
        (comment) =>
          comment.authorId === authorId ||
          (!comment.authorId && comment.authorName === authorName),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  },

  async add(input: {
    postId: string
    authorName: string
    authorId?: string
    authorColor: string
    authorAvatar?: string
    body: string
  }): Promise<Comment> {
    await sleep(520)
    const body = input.body.trim()
    if (!body) throw new Error('写点什么再发吧。')
    if (body.length > 280) throw new Error('留言最多 280 个字。')

    const comment: Comment = {
      id: makeId('comment'),
      postId: input.postId,
      authorName: input.authorName,
      authorId: input.authorId,
      authorColor: input.authorColor,
      authorAvatar: input.authorAvatar,
      body,
      createdAt: new Date().toISOString(),
      likes: 0,
      own: true,
    }
    persist([...allComments(), comment])
    return comment
  },

  async remove(id: string): Promise<void> {
    await sleep(280)
    persist(allComments().filter((comment) => comment.id !== id))
  },

  async toggleLike(id: string): Promise<number> {
    const liked = readStorage<string[]>(COMMENT_LIKES_KEY, [])
    const nextLiked = liked.includes(id) ? liked.filter((item) => item !== id) : [...liked, id]
    writeStorage(COMMENT_LIKES_KEY, nextLiked)

    const next = allComments().map((comment) => {
      if (comment.id !== id) return comment
      return { ...comment, likes: Math.max(0, comment.likes + (nextLiked.includes(id) ? 1 : -1)) }
    })
    persist(next)
    return next.find((comment) => comment.id === id)?.likes ?? 0
  },

  likedIds(): string[] {
    return readStorage<string[]>(COMMENT_LIKES_KEY, [])
  },
}

const hash = (value: string) =>
  value.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 10000, 17)

export const reactionsApi = {
  baseLikes(slug: string) {
    return 26 + (hash(slug) % 74)
  },

  state(slug: string) {
    return {
      liked: readStorage<string[]>(POST_LIKES_KEY, []).includes(slug),
      saved: readStorage<string[]>(POST_BOOKMARKS_KEY, []).includes(slug),
      likes: this.baseLikes(slug) + (readStorage<string[]>(POST_LIKES_KEY, []).includes(slug) ? 1 : 0),
    }
  },

  toggleLike(slug: string): boolean {
    const liked = readStorage<string[]>(POST_LIKES_KEY, [])
    const next = liked.includes(slug) ? liked.filter((item) => item !== slug) : [...liked, slug]
    writeStorage(POST_LIKES_KEY, next)
    return next.includes(slug)
  },

  toggleSave(slug: string): boolean {
    const saved = readStorage<string[]>(POST_BOOKMARKS_KEY, [])
    const next = saved.includes(slug) ? saved.filter((item) => item !== slug) : [...saved, slug]
    writeStorage(POST_BOOKMARKS_KEY, next)
    return next.includes(slug)
  },

  savedSlugs(): string[] {
    return readStorage<string[]>(POST_BOOKMARKS_KEY, [])
  },
}

export const newsletterApi = {
  async subscribe(email: string): Promise<void> {
    await sleep(620)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('邮箱格式不太对，检查一下。')
    }
    const list = readStorage<string[]>(SUBSCRIBERS_KEY, [])
    if (list.includes(email)) throw new Error('这个邮箱已经订过了。')
    writeStorage(SUBSCRIBERS_KEY, [...list, email])
  },
}
