/**
 * 版本记录种子生成
 * 职责：把 CHANGELOG 的版本条目与 versions.json 的最新更新合并为 server/db/seed-releases.json。
 */

import fs from 'node:fs'

const versions = JSON.parse(fs.readFileSync('src/content/versions.json', 'utf8'))
const changelog = fs.readFileSync('CHANGELOG.md', 'utf8')
const sections = changelog.split(/^## /m).slice(1)
const releases = []

for (const section of sections) {
  const lines = section.split(/\r?\n/)
  const heading = lines[0].trim()
  const match = heading.match(/^v([0-9.]+)\s*·\s*([0-9.]+)/)
  if (!match) continue
  const version = match[1]
  const date = match[2].replaceAll('.', '-')
  const items = lines
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean)
  if (items.length === 0) continue
  releases.push({ version, date, items })
}

const latest =
  versions.blog && !versions.latest.placeholder
    ? {
        version: versions.blog,
        date: versions.latest.date,
        items: versions.latest.items,
      }
    : null
const all = latest
  ? [latest, ...releases.filter((release) => release.version !== latest.version)]
  : releases
const withIds = all.map((release, index) => ({ id: index + 1, ...release, version: `v${release.version}` }))
fs.writeFileSync('server/db/seed-releases.json', `${JSON.stringify(withIds, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ count: withIds.length, versions: withIds.map((release) => release.version) }, null, 2))
