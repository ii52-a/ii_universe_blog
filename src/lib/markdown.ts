import type { ContentBlock } from '../data/posts'

export function parseArticleBody(source: string): ContentBlock[] {
  return source.trim() ? [{ type: 'markdown', text: source }] : []
}

export function countCharacters(blocks: ContentBlock[]) {
  return blocks.reduce((count, block) => {
    if (block.type === 'markdown' || block.type === 'h2' || block.type === 'p' || block.type === 'quote') {
      return count + block.text.length
    }
    if (block.type === 'list') return count + block.items.join('').length
    return count
  }, 0)
}

export function stringifyArticleBody(blocks: ContentBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === 'h2') return `## ${block.text}`
      if (block.type === 'quote') return `> ${block.text}`
      if (block.type === 'list') return block.items.map((item) => `- ${item}`).join('\n')
      if (block.type === 'figure') return `[插图：${block.caption}]`
      return block.text
    })
    .join('\n\n')
}
