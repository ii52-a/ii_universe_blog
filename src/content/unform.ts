/** UNFORM 的作品、文案与调色板；渲染器与页面共用同一份定义。 */
export const unformStudies = [
  {
    id: 'alloy', number: '01', title: 'ALLOY', name: '液态合金',
    material: 'CHROME / CONTINUOUS SURFACE', accent: '#d5ff70',
    description: '光沿着曲面游走，形态没有固定的答案。',
    action: '拖动，换一个角度。',
  },
  {
    id: 'bloom', number: '02', title: 'BLOOM', name: '粒子生长',
    material: 'PARTICLES / ORGANIC MOTION', accent: '#b9a1ff',
    description: '散开的每一点，都在寻找下一次相遇。',
    action: '提高强度，让它生长。',
  },
  {
    id: 'ribbon', number: '03', title: 'RIBBON', name: '无限回环',
    material: 'LINES / SPATIAL RHYTHM', accent: '#ff9b76',
    description: '一条线，绕开规则，也绕回自己。',
    action: '拖动，让线条交错。',
  },
] as const

export type UnformStudyIndex = 0 | 1 | 2

export interface UnformState {
  study: UnformStudyIndex
  energy: number
  playing: boolean
  reducedMotion: boolean
  impulse: number
}
