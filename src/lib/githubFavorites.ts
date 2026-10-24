import type { GithubRepo } from './backend'
import { readStorage, writeStorage } from './storage'

const KEY = 'github-favorites.v1'

export function readGithubFavorites(): GithubRepo[] {
  return readStorage<GithubRepo[]>(KEY, [])
}

export function isGithubFavorite(fullName: string) {
  return readGithubFavorites().some((repo) => repo.fullName === fullName)
}

export function toggleGithubFavorite(repo: GithubRepo) {
  const current = readGithubFavorites()
  const exists = current.some((item) => item.fullName === repo.fullName)
  const next = exists
    ? current.filter((item) => item.fullName !== repo.fullName)
    : [repo, ...current]
  writeStorage(KEY, next)
  return !exists
}
