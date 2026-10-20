import type { ContentBlock } from '../data/posts'

export function parseArticleBody(source: string): ContentBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ContentBlock[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim()
    if (text) blocks.push({ type: 'p', text })
    paragraph = []
  }

  const flushList = () => {
    if (list.length > 0) blocks.push({ type: 'list', items: [...list] })
    list = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }
    if (line.startsWith('## ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      continue
    }
    if (line.startsWith('> ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'quote', text: line.slice(2).trim() })
      continue
    }
    if (line.startsWith('- ')) {
      flushParagraph()
      list.push(line.slice(2).trim())
      continue
    }
    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

export function countCharacters(blocks: ContentBlock[]) {
  return blocks.reduce((count, block) => {
    if (block.type === 'h2' || block.type === 'p' || block.type === 'quote') {
      return count + block.text.length
    }
    if (block.type === 'list') return count + block.items.join('').length
    return count
  }, 0)
}
