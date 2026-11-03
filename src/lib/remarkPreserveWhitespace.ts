import type { Root, RootContent } from 'mdast'

/** 保留 Markdown 块之间额外的空行；代码、列表与表格内部仍按 Markdown 解析。 */
export function remarkPreserveWhitespace() {
  return (tree: Root, file: { value?: unknown }) => {
    const gap = (lines: number): RootContent => ({
      type: 'paragraph', children: [],
      data: { hName: 'div', hProperties: { className: ['markdown-gap'], 'aria-hidden': 'true', style: `height:${lines}lh` } },
    })
    const nodes: RootContent[] = []
    let previous: RootContent | undefined
    for (const node of tree.children) {
      if (node.position) {
        const empty = previous?.position ? node.position.start.line - previous.position.end.line - 2 : node.position.start.line - 1
        if (empty > 0) nodes.push(gap(empty))
      }
      nodes.push(node)
      previous = node
    }
    const trailing = previous?.position ? String(file.value ?? '').split(/\r\n|\r|\n/).length - previous.position.end.line - 1 : 0
    if (trailing > 0) nodes.push(gap(trailing))
    tree.children = nodes
  }
}
