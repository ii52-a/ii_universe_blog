import fs from 'node:fs/promises'
import path from 'node:path'

export interface VersionsFile {
  blog: string
  latest: {
    placeholder: boolean
    date: string
    items: string[]
  }
  [key: string]: unknown
}

function candidates() {
  return [
    path.resolve(process.cwd(), '../src/content/versions.json'),
    path.resolve(process.cwd(), 'src/content/versions.json'),
  ]
}

async function resolvePath() {
  for (const candidate of candidates()) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // Try the next likely working directory.
    }
  }
  throw new Error('versions.json not found')
}

export async function readVersionsFile(): Promise<VersionsFile> {
  const file = await resolvePath()
  return JSON.parse(await fs.readFile(file, 'utf8')) as VersionsFile
}

export async function writeVersionsFile(versions: VersionsFile): Promise<void> {
  const file = await resolvePath()
  const temporary = `${file}.tmp`
  await fs.writeFile(temporary, `${JSON.stringify(versions, null, 2)}\n`, 'utf8')
  await fs.rename(temporary, file)
}

export function shanghaiToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
